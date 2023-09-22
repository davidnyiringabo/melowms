"use client";
import {useState} from "react";
import {useCustomAuth} from "..//context/Auth";
import {toast} from "../components/ToasterContext";

const API_URL = "http://localhost:5000";

const useApi = <Data>() => {
  const {currentUser, isAdmin, isSuperAdmin} = useCustomAuth();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Data | undefined>(undefined);

  const request = async (url: string, init?: RequestInit | undefined) => {
    if (!currentUser || (!isAdmin && !isSuperAdmin)) {
      throw new Error("Error: Missing or insufficient permissions.");
    }
    const idTokenResult = await currentUser.getIdTokenResult();

    const token = idTokenResult.token;

    return fetch(API_URL + url, {
      ...init,
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });
  };

  return {
    loading,
    data,
    async run(callback: () => Promise<Response>) {
      setLoading(true);
      return callback()
        .then(async (res) => {
          setLoading(false);
          const data = (await res.json()) as Data & {error: string};
          if (!res.ok) {
            setData(undefined);
            throw new Error("Error: " + data.error);
          }
          setData(data);
        })
        .catch((err) => {
          setLoading(false);
          setData(undefined);
          toast.error(err.message || "Something went wrong!");
        });
    },
    getUsers() {
      return request("/list/users");
    },
    createAdmin(data: any) {
      return request("/create/admin", {method: "POST", body: data});
    },
  };
};

export default useApi;
