import { Company } from '../routes/manage/companies';
import { LoadingScreen } from '../components/AuthLoading';
import { Branches, Companies, DocNode, Transfers } from '../database';
import { Branch, UserClaims } from '../types';
import { User } from 'firebase/auth';
import {
  doc,
  getCountFromServer,
  getDoc,
  query,
  where,
} from 'firebase/firestore';
import { useLocation, useNavigate } from 'react-router-dom';
import React, { useCallback, useEffect, useState } from 'react';
import { useAuth, useFirestore, useSigninCheck } from 'reactfire';

type AuthContext = {
  currentUser: User | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  tinnumber: string | null;
  company: Company | null;
  branchData: Branch | null;
  branch: string | null;
  isManager: boolean;
  transCount: number;
  isSwitched: boolean;
  claims: UserClaims;
  Company: DocNode | null;
  Branch: DocNode | null;
  reloadTransferCount: () => void;
  reloadUser: () => Promise<any>;
};

const CustomAuthContext = React.createContext<AuthContext>({
  currentUser: null,
  isAdmin: false,
  isSuperAdmin: false,
  isManager: false,
  isSwitched: false,
  tinnumber: null,
  branch: null,
  transCount: 0,
  company: null,
  branchData: null,
  claims: {},
  Company: null,
  Branch: null,
  reloadUser: () => Promise.resolve(),
  reloadTransferCount: function (): void {},
});

export const useCustomAuth = () => React.useContext(CustomAuthContext);

const CustomAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isManager, setIsManager] = useState(false);
  const [isSwitched, setIsSwitched] = useState(false);
  const [tinnumber, setTinnumber] = useState<string | null>(null);
  const [branch, setBranch] = useState<string | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [claims, setClaims] = useState<UserClaims>({});
  const [transCount, setTransCount] = useState(0);
  const [branchData, setBranchData] = useState<Branch | null>(null);
  const firestore = useFirestore();
  const navigate = useNavigate();

  const auth = useAuth();
  const { data: userInfo, status } = useSigninCheck({ forceRefresh: true });
  const location = useLocation();

  useEffect(() => {
    if (!tinnumber) return setCompany(null);

    getDoc(doc(firestore, `companies/${tinnumber}`)).then((result) => {
      setCompany(result.data() as Company);
    });
  }, [firestore, tinnumber]);

  useEffect(() => {
    if (!branch) return setBranchData(null);
    getDoc(doc(firestore, `companies/${tinnumber}/branches/${branch}`))
      .then((result) => {
        const data = result.data() || {};
        data.id = result.id;
        setBranchData(data as Branch);
      })
      .catch((err) => console.log(err));
  }, [firestore, tinnumber, branch]);

  const reloadUser = async () =>
    auth.currentUser
      ?.getIdToken(true)
      .then((result) => {
        auth.currentUser?.getIdTokenResult().then((idResultToken) => {
          setClaims((idResultToken.claims as UserClaims) || {});
          setIsAdmin(Boolean(idResultToken.claims.admin));
          setIsManager(Boolean(idResultToken.claims.manager));
          setIsSuperAdmin(Boolean(idResultToken.claims.superAdmin));
          setIsSwitched(Boolean(idResultToken.claims.switched));
          setTinnumber(idResultToken.claims.tinnumber?.toString());
          setBranch(idResultToken.claims.branch?.toString());
        });
      })
      .catch((e) => {
        auth.currentUser?.reload();
      });

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setBranch(null);
        setTinnumber(null);
        setCompany(null);
        setBranchData(null);
        setIsAdmin(false);
        setIsManager(false);
        setIsSwitched(false);
        setIsSuperAdmin(false);
        navigate('/auth/login');
        return;
      }
      if (!user.emailVerified) {
        await auth.signOut();
        if (!location.pathname.includes('auth/verify-email'))
          navigate('/auth/verify-email/');
      }
      user?.getIdTokenResult().then((idResultToken) => {
        setClaims((idResultToken.claims as UserClaims) || {});
        setIsAdmin(Boolean(idResultToken.claims.admin));
        setIsManager(Boolean(idResultToken.claims.manager));
        setIsSuperAdmin(Boolean(idResultToken.claims.superAdmin));
        setIsSwitched(Boolean(idResultToken.claims.switched));
        setTinnumber(idResultToken.claims.tinnumber?.toString());
        setBranch(idResultToken.claims.branch?.toString());
      });
    });
    return unsub;
  }, []);

  const reloadTransferCount = useCallback(() => {
    if (!branch || !tinnumber) return;

    const transfers = Companies.doc(tinnumber as string)
      .sub(Branches)
      .doc(branch as string)
      .sub(Transfers).ref;
    const countTransfers = query(transfers, where('status', '!=', 'COMPLETED'));
    getCountFromServer(countTransfers).then((result) => {
      setTransCount(result.data().count);
    });
  }, [tinnumber, branch]);

  useEffect(() => {
    reloadTransferCount();
  }, [branch, tinnumber]);
  return (
    <CustomAuthContext.Provider
      value={{
        reloadTransferCount,
        claims,
        transCount,
        isAdmin,
        isSwitched,
        reloadUser,
        branchData,
        tinnumber,
        Company:
          typeof tinnumber === 'string' ? Companies.doc(tinnumber) : null,
        Branch:
          typeof branch === 'string' && typeof tinnumber === 'string'
            ? Companies.doc(tinnumber as string)
                .sub(Branches)
                .doc(branch as string)
            : null,
        branch,
        isManager,
        company,
        isSuperAdmin,
        currentUser: auth.currentUser,
      }}
    >
      {status === 'loading' ||
      (userInfo.signedIn && !(company || branchData || isSuperAdmin)) ? (
        <LoadingScreen />
      ) : (
        children
      )}
    </CustomAuthContext.Provider>
  );
};

export default CustomAuthProvider;
