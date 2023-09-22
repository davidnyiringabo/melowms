
import React from "react";

const Spinner = ({small = false}: {small?: boolean}) => {
  return small ? (
    <span className="animate-spin inline-block rounded-full border-b-transparent p-2 border-2"></span>
  ) : (
    <div className="flex w-full mx-auto justify-center items-center">
      <span className="animate-spin inline-block rounded-full border-b-transparent border-blue-500 p-4 border-4 m-2"></span>
    </div>
  );
};

export default Spinner;
