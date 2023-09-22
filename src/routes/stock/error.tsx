
import React from "react";

const ErrorComponent = ({error}: any) => {
  return (
    <div className="font-bold max-w-[400px] mx-auto w-full text-2xl my-5 p-2 block">
      <div className="text-sm mb-5 font-mono text-red-300 ">{error.code}</div>
      <div className="text-red-500 ">
        {error.message ? <>{error.message}</> : "Something went wrong!"}
      </div>
    </div>
  );
};

export default ErrorComponent;
