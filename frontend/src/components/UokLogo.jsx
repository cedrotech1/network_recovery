import logo from '../assets/logo.png';

export const UokLogo = ({ className = 'h-full w-full object-contain', alt = 'University of Kigali' }) => (
  <img src={logo} alt={alt} className={className} />
);
