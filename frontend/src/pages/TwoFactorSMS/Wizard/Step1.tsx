import React, { useCallback, useState, useRef } from "react";
import { FiArrowLeft } from "react-icons/fi";
import PhoneInput from "react-phone-input-2";
import { Link, useHistory } from "react-router-dom";

import { FormHandles } from "@unform/core";
import { Form } from "@unform/web";

import "react-phone-input-2/lib/style.css";

// import Input from "../../../components/Input";
import Button from "../../../components/Button";
import { useAuth } from "../../../hooks/auth";
// import { useToast } from "../../../hooks/toast";
import api from "../../../services/api";
import { Content } from "../styles";
// import { useSocket } from "../../../hooks/socket";

interface IStep1Props {
  handleNext(): void;
}

export function Step1({ handleNext }: IStep1Props) {
  const [phone, setPhone] = useState("");
  const formRef = useRef<FormHandles>(null);

  const { user, signOut, updateUser } = useAuth();
  // const { disconnectSocket } = useSocket();
  // const { addToast } = useToast();
  const history = useHistory();

  const handleSubmit = useCallback(async () => {
    handleNext();

    await api.put("/profile", { phone });
    await api.post("/sessions/send-sms");
    updateUser({ ...user, phone });
  }, [handleNext, phone, updateUser, user]);

  const handleBackToLogin = useCallback(() => {
    if (user) {
      // disconnectSocket();
      signOut();
    }

    history.push("/");
  }, [history, signOut, user]);

  return (
    <Content>
      <header>
        {/* <h1>Step 1</h1> */}
        {/* <p>Enter your cell phone number</p> */}
      </header>

      <Form
        ref={formRef}
        onSubmit={() => {
          console.log("");
        }}
      >
        <legend>Enter your cell phone number</legend>
        <PhoneInput
          country={"us"}
          value={phone}
          onChange={(value) => setPhone(value)}
        />

        <Button onClick={handleSubmit}>Next</Button>

        <Link to="/" onClick={handleBackToLogin}>
          <FiArrowLeft />
          Back to sign in
        </Link>
      </Form>
    </Content>
  );
}
