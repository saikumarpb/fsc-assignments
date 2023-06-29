const fs = require("fs");
const uuid = require("uuid");
const path = require("path");
const express = require("express");
const jsonwebtoken = require("jsonwebtoken");

const app = express();
app.use(express.json());

const JWT_SECRET = "MySuperSecretKey";

const userFilePath = path.join(__dirname, "data", "user.json");
const adminFilePath = path.join(__dirname, "data", "admin.json");
const courseFilePath = path.join(__dirname, "data", "course.json");

function getJsonFileContent(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content);
  } catch (e) {
    console.log("Error reading file at : ", filePath);
    return null;
  }
}

function writeJsonToFile(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// Admin routes
app.post("/admin/signup", async (req, res) => {
  const { username, password } = req.body;

  const isRequestBodyValid = sanityCheck([username, password]);
  if (!isRequestBodyValid) {
    return res.status(400).send("Bad Request");
  }

  const users = getJsonFileContent(userFilePath);
  const admins = getJsonFileContent(adminFilePath);

  const filteredList = filterByUsername([...users, ...admins], username);

  if (filteredList.length > 0) {
    res.status(400).send("Username taken");
  } else {
    admins.push({
      username: username,
      password: password,
    });

    writeJsonToFile(adminFilePath, admins);

    res.status(201).send({
      message: "Admin created successfully",
      token: getJwtToken(username, "admin"),
    });
  }
});

app.post("/admin/login", (req, res) => {
  const { username, password } = req.body;

  const isRequestBodyValid = sanityCheck([username, password]);
  if (!isRequestBodyValid) {
    return res.status(400).send("Bad Request");
  }
  const adminList = getJsonFileContent(adminFilePath);

  const filteredAdminList = filterByUsernameAndPassword(
    adminList,
    username,
    password
  );

  if (filteredAdminList.length === 0) {
    res.status(401).send("Unauthorized");
  } else {
    res.send({
      message: "Logged in successfully",
      token: getJwtToken(username, "admin"),
    });
  }
});

app.post("/admin/courses", authMiddleware, (req, res) => {
  const { title, description, price, published, imageLink } = req.body;

  const isRequestBodyValid = sanityCheck([
    title,
    description,
    price,
    published,
    imageLink,
  ]);

  if (!isRequestBodyValid) {
    return res.status(400).send("Bad Request");
  }

  const courses = getJsonFileContent(courseFilePath);

  const existingCourseTitle = courses.filter(
    (course) => course.title === title
  );

  if (existingCourseTitle.length > 0) {
    return res.status(400).send("Course title exists");
  }

  const courseId = uuid.v4();

  courses.push({
    title: title,
    description: description,
    price: price,
    published: published,
    imageLink: imageLink,
    courseId: courseId,
  });

  writeJsonToFile(courseFilePath, courses);

  res
    .status(201)
    .send({ message: "Course created successfully", courseId: courseId });
});

app.put("/admin/courses/:courseId", authMiddleware, (req, res) => {
  const { title, description, price, published, imageLink } = req.body;

  const courseId = req.params.courseId;

  const isRequestBodyValid = sanityCheck([
    title,
    description,
    price,
    published,
    imageLink,
  ]);

  if (!isRequestBodyValid) {
    return res.status(400).send("Bad Request");
  }

  let validCourseId = false;

  const courses = getJsonFileContent(courseFilePath);

  const updatedCourses = courses.reduce((acc, curr) => {
    if (curr.courseId === courseId) {
      acc.push({
        title: title,
        description: description,
        price: price,
        published: published,
        imageLink: imageLink,
        courseId: curr.courseId,
      });

      // update flag
      validCourseId = true;
    } else {
      acc.push(curr);
    }
    return acc;
  }, []);

  if (!validCourseId) {
    res.status(404).send("Not found");
  } else {
    writeJsonToFile(courseFilePath, updatedCourses);
    res.send({ message: "Course updated successfully" });
  }
});

app.get("/admin/courses", authMiddleware, (req, res) => {
  const courses = getJsonFileContent(courseFilePath);
  res.send(courses);
});

// User routes
app.post("/users/signup", (req, res) => {
  const { username, password } = req.body;

  const isRequestBodyValid = sanityCheck([username, password]);

  if (!isRequestBodyValid) {
    return res.status(400).send("Bad Request");
  }

  const users = getJsonFileContent(userFilePath);
  const admins = getJsonFileContent(adminFilePath);

  const filteredList = filterByUsername([...users, ...admins], username);

  if (filteredList.length > 0) {
    res.status(400).send("Username taken");
  } else {
    users.push({
      username: username,
      password: password,
      courses: [],
    });

    writeJsonToFile(userFilePath, users);

    res.status(201).send({
      message: "User created successfully",
      token: getJwtToken(username),
    });
  }
});

app.post("/users/login", (req, res) => {
  const { username, password } = req.body;

  const isRequestBodyValid = sanityCheck([username, password]);

  if (!isRequestBodyValid) {
    return res.status(400).send("Bad Request");
  }

  const users = getJsonFileContent(userFilePath);
  const filteredUserList = filterByUsernameAndPassword(
    users,
    username,
    password
  );

  if (filteredUserList.length === 0) {
    res.status(401).send("Unauthorized");
  } else {
    res.send({
      message: "Logged in successfully",
      token: getJwtToken(username),
    });
  }
});

app.get("/users/courses", authMiddleware, (req, res) => {
  const allCourses = getJsonFileContent(courseFilePath);

  const publishedCourses = allCourses.filter((course) => course.published);

  res.send(publishedCourses);
});

app.post("/users/courses/:courseId", authMiddleware, (req, res) => {
  const courseId = req.params.courseId;

  const courses = getJsonFileContent(courseFilePath);

  const filteredCourse = courses.filter(
    (course) => course.courseId === courseId
  );

  if (filteredCourse.length === 0) {
    res.status(404).send("Not found");
  } else {
    const course = filteredCourse[0];

    if (!course.published) {
      return res.status(404).send("Course not found");
    }

    let users = getJsonFileContent(userFilePath);
    const user = filterByUsername(users, req.username)[0];

    if (user.courses.includes(courseId)) {
      return res.status(400).send({ message: "Course already purchased" });
    }

    users = users.filter((xs) => xs.username !== user.username);

    users.push({ ...user, courses: [...user.courses, courseId] });

    writeJsonToFile(userFilePath, users);

    res.send({ message: "Course purchased successfully" });
  }
});

app.get("/users/purchasedCourses", authMiddleware, (req, res) => {
  const user = filterByUsername(req.username)[0];
});

app.listen(9000, () => console.log("Server running on 9000"));

// Middleware functions

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  const url = req.url;

  const role = url.split("/")[1] === "admin" ? "admin" : "user";

  if (!authHeader) {
    return res.status(401).json({ error: "No token provided" });
  }

  const [bearer, token] = authHeader.split(" ");

  if (bearer !== "Bearer" || !token) {
    return res.status(401).json({ error: "Invalid token format" });
  }

  try {
    const decoded = jsonwebtoken.verify(token, JWT_SECRET);

    if (decoded.role !== role) {
      res.status(401).send();
    } else {
      req.username = decoded.username;
      next();
    }
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// Helper functions

function getJwtToken(username, role = "user") {
  const expiresIn = "1h";
  return jsonwebtoken.sign({ username: username, role: role }, JWT_SECRET, {
    expiresIn,
  });
}

function filterByUsernameAndPassword(arr, username, password) {
  return arr.filter(
    (user) => user.username === username && user.password === password
  );
}

function filterByUsername(arr, username) {
  return arr.filter((user) => user.username === username);
}

function sanityCheck(arr) {
  for (i in arr) {
    if (arr[i] === undefined || arr[i] === null) {
      return false;
    }
  }
  return true;
}

module.exports = app;
