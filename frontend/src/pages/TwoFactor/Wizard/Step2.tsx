import { Content } from "../styles";

interface IStep2Props {
  qrimage: string;
  code: string | number;
}

export function Step2({ qrimage, code }: IStep2Props) {
  return (
    <Content>
      <header>
        <h1>Step 2</h1>
        <p>Scan this QR code in the Google Authenticator App</p>
      </header>
      <div>
        <article className="qrcode">
          <div>
            <img src={qrimage} alt="qrcode" />

            <p>
              <strong>{code}</strong>
              If you are unable to scan the QR code, prese enter this code
              manually into the app
            </p>
          </div>
          <p>
            Please save this Key on paper. This key will allow you to recover
            your Google Authenticator in case of phone loss
          </p>
          <strong>
            Important! Resetting yout Google Authenticator requires opening a
            support ticket and takes at least 7 days to process
          </strong>
        </article>
      </div>
    </Content>
  );
}
