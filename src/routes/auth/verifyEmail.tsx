import React from 'react';
import logo from '../../assets/icon-384x384.png';
import VerifyEmailForm from '../../components/forms/auth/VerifyEmailForm';
import { Link } from 'react-router-dom';

const VerifyEmailPage = () => {
  return (
    <div className="flex relative w-full shadow-md border rounded-md flex-col max-w-md mx-auto gap-2">
      <img
        className="w-24 absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2  h-2w-24"
        src={logo}
        alt="Melo WMS"
      />
      <h3 className="text-2xl pt-16 font-bold text-center">Verify Email</h3>
      <VerifyEmailForm />
      <p className="flex p-2 justify-center items-center mb-3">
        <Link to={'/auth/login'} className="text-blue-500 hover:text-blue-700">
          &larr; 
          Back to Login  
        </Link>
      </p>
    </div>
  );
};

export default VerifyEmailPage;
