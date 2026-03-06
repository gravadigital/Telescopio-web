import React from 'react';
import { GoogleLogin } from '@react-oauth/google';

interface GoogleLoginButtonProps {
  onSuccess: (credential: string) => void;
  onError: (error: unknown) => void;
  disabled?: boolean;
}

const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({ onSuccess, onError, disabled }) => {
  return (
    <div className={`google-login-wrapper${disabled ? ' google-login-wrapper--disabled' : ''}`}>
      <GoogleLogin
        onSuccess={(credentialResponse) => {
          if (credentialResponse.credential) {
            // credential is the id_token that the backend validates via tokeninfo
            onSuccess(credentialResponse.credential);
          } else {
            onError(new Error('No credential received from Google'));
          }
        }}
        onError={() => onError(new Error('Google login failed'))}
        useOneTap={false}
        text="continue_with"
        shape="rectangular"
        theme="filled_black"
        size="large"
        width="400"
      />
    </div>
  );
};

export default GoogleLoginButton;
