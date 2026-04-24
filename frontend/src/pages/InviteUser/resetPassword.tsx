import React, { useCallback, useRef, useState } from "react";
import { FiRefreshCcw } from "react-icons/fi";

import {
  Button,
  useDisclosure,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogBody,
  MenuItem,
  ModalOverlay,
} from "@chakra-ui/react";

import { IUser } from ".";
import { useToast } from "../../hooks/toast";
import api from "../../services/api";

// import { Container } from './styles';

type IResetPasswordProps = {
  user: IUser;
};

const ResetPassword: React.FC<IResetPasswordProps> = ({
  user,
}: IResetPasswordProps) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const cancelRef = useRef<any>();

  const { addToast } = useToast();

  const OverlayOne = () => (
    <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(10px)" />
  );
  const [overlay, setOverlay] = React.useState(<OverlayOne />);

  const handleResetPassword = useCallback(async () => {
    try {
      setLoadingSubmit(true);
      await api.post("/password/forgot", { email: user.email });
      addToast({
        type: "success",
        title: "Recovery email has been sent",
        description: `We have sent an email to ${user.email} with instructions on how to reset your password.`,
      });
      onClose();
    } catch (error: any) {
      addToast({
        type: "error",
        title: "Error while reseting password",
        description: error.response.data["error" || "message"],
      });
    } finally {
      setLoadingSubmit(false);
    }
  }, [addToast, user.email]);

  return (
    <>
      <MenuItem
        minH="40px"
        icon={<FiRefreshCcw size={20} />}
        isDisabled={user.status === "inactive"}
        onClick={() => {
          onOpen();
          setOverlay(<OverlayOne />);
        }}
      >
        Reset Password
      </MenuItem>

      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
        isCentered
        motionPreset={"slideInBottom"}
      >
        {overlay}
        {/* <AlertDialogOverlay> */}
        <AlertDialogContent>
          <AlertDialogHeader fontSize="lg" fontWeight="bold">
            Reset Password
          </AlertDialogHeader>

          <AlertDialogBody>
            Are you sure you want to reset the password for user {user.name}?
          </AlertDialogBody>

          <AlertDialogFooter>
            <Button
              ref={cancelRef}
              onClick={onClose}
              isDisabled={loadingSubmit}
            >
              Cancel
            </Button>
            <Button
              colorScheme="teal"
              onClick={() => handleResetPassword()}
              ml={3}
              isLoading={loadingSubmit}
              loadingText="Submitting"
            >
              Reset password
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
        {/* </AlertDialogOverlay> */}
      </AlertDialog>
    </>
  );
};

export default ResetPassword;
