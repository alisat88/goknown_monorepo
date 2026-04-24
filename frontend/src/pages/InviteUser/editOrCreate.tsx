import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { FiEdit2, FiMail, FiUser, FiUserPlus } from "react-icons/fi";
import * as Yup from "yup";

import {
  Box,
  Button,
  Center,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack,
  useDisclosure,
} from "@chakra-ui/react";
import { FormHandles } from "@unform/core";
import { Form } from "@unform/web";

import { IUser } from ".";
import { ReactComponent as Suffix } from "../../assets/suffix.svg";
import { LoadingContent } from "../../components/Asset/styles";
import Input from "../../components/Input";
import Radio from "../../components/Radio";
import { useToast } from "../../hooks/toast";
import api from "../../services/api";
import getValidationErrors from "../../utils/getValidationErrors";

type IProps = {
  ref: React.Ref<any>;
  updateUser: (user: IUser) => void;
  addUser: (user: IUser) => void;
};

export interface IEditOrCreateFunctions {
  openEditModal(user: IUser): void;
  updateUser?: (user: IUser) => void;
}

const ROLES = [
  { label: "admin", value: "admin" },
  { label: "buyer", value: "buyer" },
  { label: "seller", value: "seller" },
  { label: "issuer", value: "issuer" },
];

type IInviteFormData = {
  name?: string;
  email: string;
  amount?: number;
  role: string;
};

const EditOrCreate: React.FC<IProps> = forwardRef<
  IEditOrCreateFunctions,
  IProps
>(({ updateUser, addUser }, ref) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedUser, setSelectedUser] = useState<IUser>({} as IUser);

  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const { addToast } = useToast();

  const formRef = useRef<FormHandles>(null);

  const OverlayOne = () => (
    <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(10px)" />
  );
  const [overlay, setOverlay] = React.useState(<OverlayOne />);

  const handleSubmit = useCallback(
    async (data: IInviteFormData, { reset }: any) => {
      try {
        setLoadingSubmit(true);

        formRef.current?.setErrors({});
        const schema = Yup.object().shape({
          amount: Yup.lazy((value) =>
            value === ""
              ? Yup.string()
              : Yup.number().min(0).max(9999).nullable()
          ),
          //   name: Yup.string(),
          email: Yup.string().required().email(),
          role: Yup.string()
            .oneOf(["admin", "buyer", "seller", "issuer"])
            .required(),
        });

        const formData = {
          //   name: data.name,
          email: data.email,
          amount: data.amount,
          role: data.role,
        };

        console.log(formData);

        await schema.validate(data, { abortEarly: false });

        const response = await api.post(`/users/invite`, formData);

        addUser(response.data);

        onClose();
        addToast({
          type: "success",
          title: "Invitation sent",
          description: "The user will receive an email with the invitation",
        });
      } catch (err: any) {
        if (err instanceof Yup.ValidationError) {
          const errors = getValidationErrors(err);

          formRef.current?.setErrors(errors);
          return;
        }
        console.log(err);
        addToast({
          type: "error",
          title: "Error while creating account",
          description: err.response.data["error" || "message"],
        });
      } finally {
        setLoadingSubmit(false);
      }
    },
    [addToast, onClose]
  );

  const handleSubmitEdit = useCallback(
    async (data: IInviteFormData, { reset }: any) => {
      try {
        setLoadingSubmit(true);

        formRef.current?.setErrors({});
        const schema = Yup.object().shape({
          name: Yup.string(),

          role: Yup.string()
            .oneOf(["admin", "buyer", "seller", "issuer"])
            .required(),
        });

        const formData = {
          name: data.name,
          role: data.role,
        };

        console.log(formData);

        await schema.validate(data, { abortEarly: false });

        const response = await api.put(
          `/admin/users/${selectedUser.sync_id}`,
          formData
        );
        const updatedUserState = {
          ...selectedUser,
          ...formData,
        } as IUser;
        updateUser(updatedUserState);
        onClose();
        addToast({
          type: "success",
          title: "Invitation sent",
          description: "The user will receive an email with the invitation",
        });
      } catch (err: any) {
        if (err instanceof Yup.ValidationError) {
          const errors = getValidationErrors(err);

          formRef.current?.setErrors(errors);
          return;
        }
        console.log(err);
        addToast({
          type: "error",
          title: "Error while creating account",
          description: err.response.data["error" || "message"],
        });
      } finally {
        setLoadingSubmit(false);
      }
    },
    [addToast, onClose, selectedUser]
  );

  //   const handleOpenEditModal = (user: IUser) => {
  //     onOpen();
  //   };

  const loadForm = useCallback(() => {
    if (selectedUser) {
      formRef.current?.setData({
        name: selectedUser.name,
        email: selectedUser.email,
        role: selectedUser.role,
      });
    }
  }, [selectedUser]);

  useImperativeHandle(ref, () => ({
    openEditModal: (user: IUser) => {
      setSelectedUser(user);
      loadForm();
      onOpen();
    },
  }));

  return (
    <>
      <Button
        leftIcon={<FiUserPlus />}
        colorScheme="blue"
        onClick={() => {
          setOverlay(<OverlayOne />);
          setSelectedUser({} as IUser);
          onOpen();
        }}
      >
        Invite user
      </Button>

      <Modal
        isCentered
        isOpen={isOpen}
        onClose={onClose}
        motionPreset={"slideInBottom"}

        // variant="wacky"
      >
        {overlay}
        <ModalContent>
          <ModalHeader>
            {selectedUser?.id ? `Edit ${selectedUser.name}` : "Create User"}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {/* {loadingSubmit ? (
              <Center>
                <VStack>
                  <BounceLoader size={32} color={"#bebebe"} />
                  <Text fontSize="sm" colorScheme="gray">
                    {user?.id ? "Please await" : "Inviting user..."}
                  </Text>
                </VStack>
              </Center>
            ) : ( */}
            <Form
              initialData={selectedUser}
              ref={formRef}
              onSubmit={selectedUser.id ? handleSubmitEdit : handleSubmit}
            >
              {selectedUser?.id && (
                <Input
                  name="name"
                  icon={FiUser}
                  placeholder="Full name"
                  isLoading={loadingSubmit}
                />
              )}

              <Input
                name="email"
                icon={FiMail}
                placeholder="E-mail"
                isLoading={loadingSubmit}
                isDisabled={!!selectedUser.id}
              />
              {!selectedUser?.id && (
                <Input
                  name="amount"
                  placeholder="Initial Tokens"
                  icon={Suffix}
                  isLoading={loadingSubmit}
                />
              )}
              <Radio
                direction="row"
                label={"Role"}
                name={"role"}
                options={ROLES}
              />
            </Form>
            {/* )} */}
          </ModalBody>
          <ModalFooter>
            {selectedUser.id ? (
              <Button
                isLoading={loadingSubmit}
                onClick={() => formRef.current?.submitForm()}
                leftIcon={<FiEdit2 />}
                colorScheme="teal"
              >
                Save
              </Button>
            ) : (
              <Button
                colorScheme="teal"
                isLoading={loadingSubmit}
                onClick={() => formRef.current?.submitForm()}
              >
                Send invitation
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
});

export default EditOrCreate;
