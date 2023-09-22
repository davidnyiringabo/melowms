import React, { useEffect, useState } from 'react';
import { auth } from '../../firebaseConfig';
import { IdTokenResult, signInWithEmailAndPassword } from 'firebase/auth';
import { useForm, SubmitHandler } from 'react-hook-form';
import { toast } from '../../components/ToasterContext';
import { useAuth, useFunctions, useSigninCheck } from 'reactfire';
import { Link, useNavigate } from 'react-router-dom';
import Spinner from '../../components/Spinner';
import logo from '../../assets/icon-384x384.png';
import { httpsCallable } from 'firebase/functions';
import { useCustomAuth } from '../../context/Auth';
import cloudFunctionNames from '../../functionNames';

type LoginFields = {
  email: string;
  password: string;
};

const Login = () => {
  const {
    register,
    formState: { isSubmitting, isSubmitted },
    handleSubmit,
  } = useForm<LoginFields>();

  const { reloadUser } = useCustomAuth();

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const switchFromAccount = httpsCallable(
    useFunctions(),
    cloudFunctionNames.switchFromAccount
  );

  const handleNavigate = async (token: IdTokenResult) => {
    await reloadUser();
    if (token.claims.superAdmin) {
      navigate('/manage');
    } else {
      navigate('/dashboard');
    }
  };

  const handleSwitchBack = async () => {
    return new Promise(async (resolve) => {
      try {
        setLoading(true);
        await switchFromAccount();
        setLoading(false);
        resolve(true);
      } catch (error: any) {
        setLoading(false);
        toast.error(error.message);
        resolve(true);
      }
    });
  };

  const handleLogin: SubmitHandler<LoginFields> = async (data) => {
    return signInWithEmailAndPassword(auth, data.email, data.password)
      .then(async (result) => {
        if (!result.user.emailVerified) {
          await auth.signOut();
          return navigate('/auth/verify-email/');
        }
        await result.user.reload();
        const token = await result.user.getIdTokenResult();
        const isSwitched = token.claims.switched === true;
        if (isSwitched) handleSwitchBack().then((r) => handleNavigate(token));
        else {
          handleNavigate(token);
        }
        toast.success('You have logged in as ' + result.user.email);
      })
      .catch((err) => {
        toast.error(err.message.split(':')[1]);
        return Promise.reject();
      });
  };

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) return;
      if (!user.emailVerified) {
        await auth.signOut();
        return navigate('/auth/verify-email/');
      }
      const claims = await user.getIdTokenResult();
      if (claims.claims.superAdmin) {
        navigate('/manage');
      } else {
        navigate('/dashboard');
      }
    });
    return unsub;
  }, []);

  // useEffect(() => {
  //   if (status === 'loading' && data.signedIn) {
  //     navigate('/dashboard');
  //   }
  // }, [status, data]);

  useEffect(() => {
    document.title = 'Auth | Login';
  }, []);

  return (
    <div className="w-full bg-blue-200/5 shadow-lg relative border max-w-md rounded-md    flex flex-col gap-2 items-center">
      <img
        className="w-24 absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2  h-2w-24"
        src={logo}
        alt="Melo WMS"
      />
      <form
        onSubmit={handleSubmit(handleLogin)}
        className="flex gap-2  p-2 mx-auto pt-4 my-3 mt-14 flex-col max-w-[300px] w-full"
      >
        <label htmlFor="email">Email</label>
        <input
          {...register('email')}
          id="email"
          type="email"
          className="p-2 border-blue-500"
          placeholder="Email"
        />
        <label htmlFor="pass">Password</label>
        <input
          {...register('password')}
          id="pass"
          className="p-2 border-blue-500"
          placeholder="password"
          type="password"
        />
        <p className="flex items-center gap-2 my-2">
          <Link
            to={'/auth/reset-password'}
            className="text-blue-500 hover:text-blue-700"
          >
            Forgot password?
          </Link>
          <span className="h-4 w-[1.5px] bg-black"></span>
          <Link
            to={'/auth/verify-email'}
            className="text-blue-500 hover:text-blue-700"
          >
            Verify Account &rarr;
          </Link>
        </p>
        <button className="btn w-full mt-2 p-2 text-xl">
          {loading || (isSubmitting && !isSubmitted && <Spinner small />)}{' '}
          {(isSubmitting && !isSubmitted) || status === 'loading'
            ? 'Login..'
            : 'Login'}
        </button>
      </form>
    </div>
  );
};

export default Login;
