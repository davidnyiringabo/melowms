import { sideLink } from '../../data/sidebar-data';
import { Link } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import withAuthorization from '../hocs/withAuthorization';

export default function SideLink({
  open,
  link: link,
  count = 0,
}: {
  open: boolean;
  count: number;
  link: sideLink;
}) {
  const location = useLocation();

  const needsABadge = link.name === 'Sales' && count > 0;

  const active = () => {
    return link.path === ''
      ? location.pathname === '/'
      : location.pathname.startsWith('/' + link.path);
  };
  const LinkEl = () => (
    <Link to={`/${link.path}`}>
      <div
        className={`relative ${
          !open ? 'justify-center' : ''
        } flex items-center rounded text-white gap-2 my-4 py-3 px-2 cursor-pointer hover:bg-blue-100/50 ${
          active() ? 'bg-blue-600' : ''
        }`}
      >
        <link.icon className={open ? 'w-7 h-7' : 'w-5 font-bold h-5'} />
        {open && <span className="text-white">{link.name}</span>}
        {needsABadge && (
          <span
            className={`border border-red-400 rounded-full  h-6 w-6 flex justify-center items-center bg-red-100 text-red-500 font-extrabold  ${
              !open
                ? 'absolute top-0 right-0 -translate-y-1/3 translate-x-1/3'
                : ''
            }`}
          >
            {count}
          </span>
        )}
      </div>
    </Link>
  );

  const AuthorizedLink = withAuthorization({
    requiredClaims: link.claims ?? {},
    all: false,
    quiet: true,
  })(LinkEl);

  return <AuthorizedLink />;
}
