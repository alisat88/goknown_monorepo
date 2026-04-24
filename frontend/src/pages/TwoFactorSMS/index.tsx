import { useMemo, useState, useCallback, useEffect } from "react";

import { Form } from "@unform/web";

import logoImg from "../../assets/logo.svg";
import Button from "../../components/Button";
import Input from "../../components/Input";
import { useAuth } from "../../hooks/auth";
import api from "../../services/api";
import { Container } from "./styles";
import { Footer } from "./Wizard/Footer";
import { FormVerify } from "./Wizard/FormVerify";
import { Step1 } from "./Wizard/Step1";

export function TwoFactorSMS() {
  const { user } = useAuth();

  const [step, setStep] = useState(1);

  const WizardStep = useCallback(() => {
    let CurrentStep;
    switch (step) {
      case 1:
        CurrentStep = <Step1 handleNext={() => setStep(step + 1)} />;
        break;
      case 2:
        CurrentStep = <FormVerify />;
        break;
      default:
        CurrentStep = <Step1 handleNext={() => setStep(step + 1)} />;
        break;
    }

    return (
      <section>
        {CurrentStep}
        {/* <Footer
          firstStep={step === 1}
          lastStep={step === 3}
          handleNext={() => setStep(step + 1)}
          handlePrevious={() => setStep(step - 1)}
        /> */}
      </section>
    );
  }, [step]);

  return (
    <Container>
      <header>
        <img src={logoImg} alt="logo" />
        <h1>Two-factor authentication</h1>
      </header>

      {!user.hasTwoFactorCode ? (
        /* <ul>
          1. Download Google Authenticator App on
        </ul>

        <img src={QRCodeImg} alt="QRCode" /> */
        <WizardStep />
      ) : (
        // <WizardStep />

        <FormVerify />
      )}
    </Container>
  );
}
