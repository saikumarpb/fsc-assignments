import { useEffect, useState } from 'react';

export const PENDING = 'PENDING';
export const SUCCESS = 'SUCCESS';
export const FAILURE = 'FAILURE';

function useApi(api) {
  const [res, setRes] = useState({ state: PENDING, data: null });

  useEffect(() => {
    api
      .then((data) => {
        setRes(() => {
          return { state: SUCCESS, data: data.data };
        });
      })
      .catch((e) => {
        console.log(e);
        setRes(() => {
          return { state: FAILURE, data: null };
        });
      });
  }, []);

  return res;
}

export default useApi;
