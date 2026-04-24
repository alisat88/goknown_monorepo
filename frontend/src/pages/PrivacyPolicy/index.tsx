import React from "react";

import { Container, Content, PolicyText } from "./styles";

const PrivacyPolicy: React.FC = () => {
  return (
    <Container>
      <Content>
        <h1>Privacy Policy</h1>

        <PolicyText>
          <p>
            <strong>Effective Date:</strong> [2025-02-11]
          </p>

          <h2>1. Introduction</h2>
          <p>
            Welcome to GoKnown.app ("Company," "we," "our," "us"). This Privacy
            Policy explains how we collect, use, disclose, and safeguard your
            information when you use our application. By using our services, you
            agree to the terms outlined in this policy.
          </p>

          <h2>2. Information We Collect</h2>
          <p>We collect the following types of data:</p>
          <ul>
            <li>
              <strong>Personal Data:</strong> Includes email address, IP
              address, and other identifiers. All contact details will be
              anonymized for marketing purposes.
            </li>
            <li>
              <strong>Usage Data:</strong> Information on interactions with our
              app, pages viewed, time spent, and preferences.
            </li>
            <li>
              <strong>Device Information:</strong> Details like device type,
              operating system, and browser.
            </li>
            <li>
              <strong>Cookies & Tracking Technologies:</strong> We use tracking
              tools to enhance user experience and analyze traffic.
            </li>
          </ul>

          <h2>3. How We Use Your Data</h2>
          <p>We process collected data to:</p>
          <ul>
            <li>Provide and maintain services.</li>
            <li>Improve user experience and application performance.</li>
            <li>Conduct marketing and promotional campaigns.</li>
            <li>Monitor and analyze user activity for improvements.</li>
            <li>Comply with legal obligations.</li>
          </ul>

          <h2>4. Sharing of Data</h2>
          <p>
            We do not sell personal data. However, we may share anonymized or
            aggregated data with third-party service providers for marketing,
            analytics, and application improvements.
          </p>

          <h2>5. Data Security</h2>
          <p>
            We use industry-standard security measures to protect your data.
            However, no method of transmission over the internet is 100% secure.
          </p>

          <h2>6. Your Rights and Choices</h2>
          <ul>
            <li>Request access, correction, or deletion of your data.</li>
            <li>Opt-out of marketing communications.</li>
            <li>Adjust cookie and tracking preferences.</li>
          </ul>

          <h2>7. Third-Party Services</h2>
          <p>
            We use Microsoft Clarity for analytics and privacy tools. You can
            review their privacy policy here:{" "}
            <a
              href="https://clarity.microsoft.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
            >
              https://clarity.microsoft.com/privacy
            </a>
            .
          </p>

          <h2>8. Changes to This Privacy Policy</h2>
          <p>
            We may update this policy periodically. Users will be notified of
            significant changes.
          </p>

          <h2>9. Contact Information</h2>
          <p>
            If you have questions about this Privacy Policy, contact us at{" "}
            <a href="mailto:info@goknown.com">info@goknown.com</a>.
          </p>
        </PolicyText>
      </Content>
    </Container>
  );
};

export default PrivacyPolicy;
