import {useCustomAuth} from "../../context/Auth";
import {Claim, UserClaims} from "../../types";
import {ClaimsValidator, useSigninCheck} from "reactfire";
import Spinner from "../Spinner";

const withAuthorization =
  ({ requiredClaims, all = true, quiet = false }: { requiredClaims: UserClaims; all?: boolean; quiet?: boolean; }) =>
  <P extends object>(Component: React.ComponentType<P>): React.FC<P> => {
    const validateCustomClaims: ClaimsValidator = (claims) => {
      let hasRequiredClaims = false;
      if (
        Object.keys(requiredClaims).length === 0 ||
        Object.entries(requiredClaims).some(
          ([k, v]) => requiredClaims[k as Claim] === claims[k]
        )
      ) {
        hasRequiredClaims = true;
      }
      return {
        hasRequiredClaims,
        errors: {},
      };
    };
    const AuthorizationComponent: React.FC<P> = (props) => {
      const {isSuperAdmin, claims} = useCustomAuth();

      const {status, data} = useSigninCheck({requiredClaims: requiredClaims});

      if (status === "loading") {
        return <Spinner />;
      }

      const hasRequiredClaims = all
        ? data?.hasRequiredClaims ?? false
        : validateCustomClaims(claims).hasRequiredClaims;
      const signedIn = data?.signedIn ?? false;

      if ((signedIn && hasRequiredClaims) || (isSuperAdmin && requiredClaims.superAdmin !== false)) {
        return <Component {...(props as P)} />;
      } else {
        if (quiet) return null;
        return (
          <div className="font-bold max-w-[400px] mx-auto w-full text-2xl my-5 p-2 block">
            <div className="text-sm mb-5 font-mono text-red-300 ">
              Access denied
            </div>
            <div className="text-red-500 ">
              You&apos;re not allowed to see this.
            </div>
          </div>
        );
      }
    };

    return AuthorizationComponent;
  };

export default withAuthorization;
