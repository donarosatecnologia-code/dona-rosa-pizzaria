interface FacebookLoginResponse {
  authResponse?: {
    code?: string;
    accessToken?: string;
  };
  status?: string;
}

interface FacebookStatic {
  init(params: {
    appId: string;
    autoLogAppEvents?: boolean;
    xfbml?: boolean;
    version: string;
  }): void;
  login(
    callback: (response: FacebookLoginResponse) => void,
    options: Record<string, unknown>,
  ): void;
}

interface Window {
  FB?: FacebookStatic;
  fbAsyncInit?: () => void;
}
