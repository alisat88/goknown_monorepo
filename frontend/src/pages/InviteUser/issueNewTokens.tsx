import { useCallback, useRef, useState } from "react";
import { FiLock } from "react-icons/fi";
import * as Yup from "yup";

import {
  Button,
  Divider,
  MenuItem,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spacer,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import userEvent from "@testing-library/user-event";
import { FormHandles } from "@unform/core";
import { Form } from "@unform/web";

import { IUser } from ".";
import { ReactComponent as Suffix } from "../../assets/suffix.svg";
import Input from "../../components/Input";
import { useToast } from "../../hooks/toast";
import api from "../../services/api";
import getValidationErrors from "../../utils/getValidationErrors";

type IResetPasswordProps = {
  user: IUser;
};

type IFormData = {
  amount: number;
  password: string;
};

const IssueNewTokens: React.FC<IResetPasswordProps> = ({
  user,
}: IResetPasswordProps) => {
  const OverlayOne = () => (
    <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(10px)" />
  );
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [overlay, setOverlay] = useState(<OverlayOne />);

  const { addToast } = useToast();
  const formRef = useRef<FormHandles>(null);

  const handleSubmit = useCallback(
    async (data: IFormData, { reset }: any) => {
      try {
        setLoadingSubmit(true);

        formRef.current?.setErrors({});
        const schema = Yup.object().shape({
          amount: Yup.number().min(0).max(9999).required(),
          password: Yup.string().required(),
        });

        await schema.validate(data, { abortEarly: false });

        const formData = {
          amount: data.amount,
          password: data.password,
        };

        await api.post(`/admin/users/${user.sync_id}/issue-tokens`, formData);

        addToast({
          type: "success",
          title: "Tokens Issued",
          description: `Successfully issued ${formData.amount} tokens to ${user.name}`,
        });
        onClose();
      } catch (err: any) {
        if (err instanceof Yup.ValidationError) {
          const errors = getValidationErrors(err);

          formRef.current?.setErrors(errors);
          return;
        }
        console.log(err);
        addToast({
          type: "error",
          title: "Error Issuing Tokens",
          description: err.response.data["error" || "message"],
        });
      } finally {
        setLoadingSubmit(false);
      }
    },
    [addToast, user.name, user.sync_id, onClose]
  );

  return (
    <>
      <MenuItem
        minH="40px"
        isDisabled={user.status === "inactive" || user.status === "pending"}
        onClick={() => {
          setOverlay(<OverlayOne />);
          onOpen();
        }}
        icon={<Suffix style={{ width: 20 }} />}
      >
        Issue New Tokens
      </MenuItem>

      <Modal isCentered isOpen={isOpen} onClose={onClose}>
        {overlay}
        <ModalContent>
          <ModalHeader>Issue Tokens for {user.name}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Form initialData={userEvent} ref={formRef} onSubmit={handleSubmit}>
              <Input
                name="amount"
                placeholder="Issue Tokens"
                icon={Suffix}
                isLoading={loadingSubmit}
              />

              <Divider marginTop="10" marginBottom={"5"} />

              <Text colorScheme="gray">
                To continue, please enter your password.{" "}
              </Text>
              <Input
                name="password"
                icon={FiLock}
                type="password"
                placeholder="Admin Password"
                isLoading={loadingSubmit}
              />
            </Form>
          </ModalBody>
          <ModalFooter>
            <Button
              colorScheme="teal"
              onClick={() => formRef.current?.submitForm()}
              isLoading={loadingSubmit}
            >
              Submit
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default IssueNewTokens;
