import React, { useCallback, useRef, useState, useEffect } from "react";
import { FiArrowLeft, FiMail, FiUser, FiLock } from "react-icons/fi";
import { Link, useHistory } from "react-router-dom";
import * as Yup from "yup";

import { FormHandles } from "@unform/core";
import { Form } from "@unform/web";

import logoImg from "../../assets/logo.svg";
import Button from "../../components/Button";
import EulaModal from "../../components/EulaModal";
import Input from "../../components/Input";
import { useToast } from "../../hooks/toast";
import api from "../../services/api";
import getValidationErrors from "../../utils/getValidationErrors";
import {
  Container,
  Content,
  AnimationContainer,
  Background,
  EulaContainer,
  WelcomeContent,
} from "./styles";

interface ISignUpFormData {
  name: string;
  email: string;
  password: string;
}

const SignUp: React.FC<React.PropsWithChildren<unknown>> = () => {
  const [loading, setLoading] = useState(false);
  const [eulaModalOpen, setEulaModalOpen] = useState(false);
  const [eulaAccepted, setEulaAccepted] = useState(false);
  const [formData, setFormData] = useState<ISignUpFormData>(
    {} as ISignUpFormData
  );
  const [showWelcome, setShowWelcome] = useState(false);
  const [canCreateAccount, setCanCreateAccount] = useState(false);
  const { addToast } = useToast();

  const formRef = useRef<FormHandles>(null);
  const welcomeRef = useRef<HTMLDivElement>(null);
  const endMarkerRef = useRef<HTMLDivElement>(null);
  const history = useHistory();

  const handleSubmitForm = useCallback(
    async (data: ISignUpFormData) => {
      try {
        formRef.current?.setErrors({});
        const schema = Yup.object().shape({
          name: Yup.string().required("Name is required"),
          email: Yup.string()
            .required("E-mail is required")
            .email("Enter a valid e-mail"),
          password: Yup.string().min(6, "Minimum of 6 characters"),
        });

        await schema.validate(data, { abortEarly: false });

        // Save form data to use later
        setFormData(data);

        // Ir para a tela de boas-vindas
        setShowWelcome(true);
      } catch (err: any) {
        if (err instanceof Yup.ValidationError) {
          const errors = getValidationErrors(err);
          formRef.current?.setErrors(errors);
          return;
        }

        addToast({
          type: "error",
          title: "Form error",
          description: "Please check the information provided and try again.",
        });
      }
    },
    [addToast]
  );

  const handleCreateAccount = useCallback(async () => {
    try {
      setLoading(true);

      if (!canCreateAccount) {
        return;
      }

      // Create account with previously saved data
      await api.post("/users", formData);

      const description =
        process.env.REACT_APP_BYPASS_EMAIL === "true"
          ? "Your account has been created. You can now log in."
          : "You will receive a PIN in your email to activate your account when you log in";

      addToast({
        type: "success",
        title: "Account created",
        timeout: 8000,
        description,
      });
      history.push("/");
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Error creating account",
        description: err.response?.data?.error || err.message,
      });
    } finally {
      setLoading(false);
    }
  }, [addToast, canCreateAccount, formData, history]);

  const handleOpenEulaModal = useCallback(() => {
    setEulaModalOpen(true);
  }, []);

  const handleCloseEulaModal = useCallback(() => {
    setEulaModalOpen(false);
  }, []);

  const handleEulaChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setEulaAccepted(e.target.checked);
    },
    []
  );

  const handleScroll = useCallback(() => {
    if (!welcomeRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = welcomeRef.current;

    // Calcular a porcentagem de rolagem
    const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;

    console.log("Scroll percentage:", scrollPercentage);

    // Se rolou 80% ou mais da página, liberar o botão
    if (scrollPercentage >= 0.8) {
      setCanCreateAccount(true);
    }
  }, []);

  // Also check when component is mounted (in case screen is small and doesn't need scrolling)
  useEffect(() => {
    // Check once when Welcome component is mounted
    if (welcomeRef.current) {
      const { scrollHeight, clientHeight } = welcomeRef.current;

      // Se o conteúdo couber inteiramente na tela sem precisar rolar
      if (clientHeight >= scrollHeight) {
        setCanCreateAccount(true);
      }
    }
  }, [showWelcome]);

  useEffect(() => {
    const welcomeElement = welcomeRef.current;
    if (welcomeElement) {
      welcomeElement.addEventListener("scroll", handleScroll);
    }

    return () => {
      if (welcomeElement) {
        welcomeElement.removeEventListener("scroll", handleScroll);
      }
    };
  }, [handleScroll]);

  // Método alternativo usando IntersectionObserver
  useEffect(() => {
    if (!endMarkerRef.current) return;

    const options = {
      root: welcomeRef.current,
      rootMargin: "0px",
      threshold: 0.1,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          console.log("End marker is visible, enabling button");
          setCanCreateAccount(true);
        }
      });
    }, options);

    observer.observe(endMarkerRef.current);

    return () => {
      if (endMarkerRef.current) {
        observer.unobserve(endMarkerRef.current);
      }
    };
  }, [showWelcome]);

  return (
    <Container>
      <Background />
      <Content>
        {!showWelcome ? (
          <AnimationContainer>
            <img src={logoImg} alt="GoBarber" />

            <Form ref={formRef} onSubmit={handleSubmitForm}>
              <h1>Create your account</h1>

              <Input
                name="name"
                icon={FiUser}
                placeholder="Full name"
                isLoading={loading}
              />
              <Input
                name="email"
                icon={FiMail}
                placeholder="E-mail"
                isLoading={loading}
              />
              <Input
                name="password"
                icon={FiLock}
                type="password"
                placeholder="Password"
                isLoading={loading}
              />

              <EulaContainer>
                <div className="checkbox-wrapper">
                  <input
                    type="checkbox"
                    id="eulaAccepted"
                    name="eulaAccepted"
                    onChange={handleEulaChange}
                  />
                  <label htmlFor="eulaAccepted">
                    I agree to the{" "}
                    <button type="button" onClick={handleOpenEulaModal}>
                      End User License Agreement
                    </button>
                  </label>
                </div>
              </EulaContainer>

              <Button type="submit" disabled={!eulaAccepted}>
                Next
              </Button>
            </Form>
            <Link to="/">
              <FiArrowLeft />
              Back to login
            </Link>
            <Link
              to="/privacy-policy"
              target="_blank"
              style={{ marginTop: 50 }}
            >
              Privacy Policy
            </Link>
          </AnimationContainer>
        ) : (
          <AnimationContainer>
            <img src={logoImg} alt="GoBarber" />
            <WelcomeContent ref={welcomeRef}>
              <h1>Welcome to DAppGenius!</h1>

              {/* Remover este código depois que o problema estiver resolvido */}
              {process.env.REACT_APP_SHOW_DEBUG === "true" && (
                <div
                  style={{
                    background: "#f0f0f0",
                    padding: "10px",
                    marginBottom: "10px",
                  }}
                >
                  <p>
                    <strong>Debug:</strong> Can create account:{" "}
                    {canCreateAccount ? "Yes" : "No"}
                  </p>
                </div>
              )}

              <p>
                GoKnown, LLC (GoKnown) is very excited to have you as a
                participant in the initial Beta rollout of our distributed
                ledger technology, DAppGenius! We look forward to reading,
                viewing and hearing your insights, opinions and overall
                assessment of the project. This initial release is a no-code
                version of DAppGenius that does not require any programming
                knowledge or expertise. It does, however, require something
                invaluable that only you can provide. Your imagination!
              </p>

              <p>
                DAppGenius consists of a collection of decentralized software
                applications or DApps, each of which is designed for a specific
                purpose. The no-code DApps provided with the system include:
              </p>

              <ul>
                <li>
                  <strong>Organization</strong> – Allows the creation of
                  user-defined organizational structures and rules.
                </li>
                <li>
                  <strong>Digital Assets</strong> – Provides users with the
                  tools to upload, permission and share documents, images,
                  videos and audio files.
                </li>
                <li>
                  <strong>Groups</strong> – Allows admins and users to create
                  groups of users that can share access to permissioned data.
                </li>
                <li>
                  <strong>Wallet</strong> – Holds your tokens. The management
                  and use of the tokens is to be determined by the group. They
                  are not designed solely for payments. Tokens can also be used
                  for identification, for rewards, or any number of other uses
                  depending on your application.
                </li>
                <li>
                  <strong>Forms</strong> – Provides users with a drag-and-drop
                  forms generator that can be used to create, edit and view data
                  forms and their data.
                </li>
                <li>
                  <strong>Messenger</strong> – Enables one-to-one messaging.
                </li>
                <li>
                  <strong>Audit</strong> – An audit feature that allows a user
                  to search and display transaction data stored in the immutable
                  ledger.
                </li>
              </ul>

              <p>
                Participants will be organized into groups. The members of each
                group will work together to document or otherwise describe an
                application using the DAppGenius DApps.
              </p>

              <p>Possible use cases include:</p>
              <ul>
                <li>
                  a private classroom with lesson plans, student projects and
                  tests
                </li>
                <li>a team and workgroup environment (think Slack)</li>
                <li>a social media platform</li>
                <li>
                  a Decentralized Autonomous Organization (DAO) for creatives
                  that includes musicians, visual artists, poets, writers,
                  digital artists, animators, etc. (think NewGrounds)
                </li>
                <li>
                  a permissioned, document portal (e.g., whitepapers, videos,
                  slide shows)
                </li>
                <li>and anything else you can imagine</li>
              </ul>

              <p>
                When DAppGenius for Developers becomes available, participants
                in this Beta will be given the opportunity to turn their use
                case into fully functional software applications by combining
                their own software DApps with the DAppGenius Dapps.
              </p>

              <p>
                But most importantly, GoKnown wants you to have fun! Click here
                to go to DAppGenius.
              </p>

              <div className="footer-info">
                <p>
                  URL:{" "}
                  <a
                    href="https://www.goknown.com"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    www.goknown.com
                  </a>
                </p>
                <p>
                  GoKnown, LLC / 19195 Mystic Pointe Drive, #303 / Aventura,
                  Florida / 33180
                </p>

                {/* Botão para permitir liberação manual */}
                <button
                  type="button"
                  className="enable-button"
                  onClick={() => setCanCreateAccount(true)}
                >
                  I've read all the content
                </button>
              </div>

              {/* Marker to detect when user reached the end */}
              <div ref={endMarkerRef} style={{ height: "1px" }}></div>
            </WelcomeContent>

            <Button
              onClick={handleCreateAccount}
              disabled={!canCreateAccount}
              isLoading={loading}
            >
              {canCreateAccount ? "Create Account" : "Continue reading..."}
            </Button>

            <Link to="/" onClick={() => setShowWelcome(false)}>
              <FiArrowLeft />
              Back
            </Link>
          </AnimationContainer>
        )}
      </Content>

      <EulaModal isOpen={eulaModalOpen} onClose={handleCloseEulaModal} />
    </Container>
  );
};

export default SignUp;
