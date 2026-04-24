import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  FiDownload,
  FiEdit2,
  FiMail,
  FiPlus,
  FiUpload,
  FiUser,
  FiUserCheck,
  FiUserPlus,
  FiUserX,
} from "react-icons/fi";
import * as Yup from "yup";

import {
  Box,
  Button,
  Center,
  Divider,
  Flex,
  HStack,
  Link,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Progress,
  Text,
  VStack,
  useDisclosure,
} from "@chakra-ui/react";
import { FormHandles } from "@unform/core";
import { Form } from "@unform/web";

import { IUser } from ".";
import demoFile from "../../assets/demo.csv";
import { ReactComponent as Suffix } from "../../assets/suffix.svg";
import { LoadingContent } from "../../components/Asset/styles";
import Input from "../../components/Input";
import InputFile from "../../components/InputFile";
import Radio from "../../components/Radio";
import { useToast } from "../../hooks/toast";
import api from "../../services/api";
import getValidationErrors from "../../utils/getValidationErrors";

type IProps = {
  // ref: React.Ref<any>;
};

export interface IEditOrCreateFunctions {
  openEditModal(user: IUser): void;
}

const ROLES = [
  { label: "admin", value: "admin" },
  { label: "buyer", value: "buyer" },
  { label: "seller", value: "seller" },
  { label: "issuer", value: "issuer" },
];

type IUploadFormData = {
  file: any;
};

type IRegisteredData = {
  email: string;
  status: "success" | "error";
  message?: string;
};

type IRegisteredResponse = {
  error: IRegisteredData[];
  sussecceful: IRegisteredData[];
};

export enum EnumCSVType {
  "text/csv" = "csv",
}

export type CSVTypes = keyof typeof EnumCSVType;

const FILE_SIZE = 1 * 1024 * 1024;
const SUPPORTED_FORMATS = Object.keys(EnumCSVType);

const Upload: React.FC<IProps> = forwardRef<IEditOrCreateFunctions, IProps>(
  (props, ref) => {
    const { isOpen, onOpen, onClose } = useDisclosure();

    const [loadingSubmit, setLoadingSubmit] = useState(false);
    const [registered, setRegistered] = useState<IRegisteredResponse>({
      error: [],
      sussecceful: [],
    } as IRegisteredResponse);
    const [percent, setPercent] = useState(0);
    const [uploading, setUploading] = useState(false);
    const { addToast } = useToast();

    const formRef = useRef<FormHandles>(null);

    const OverlayOne = () => (
      <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(10px)" />
    );
    const [overlay, setOverlay] = React.useState(<OverlayOne />);

    const handleSubmit = useCallback(
      async (data: IUploadFormData, { reset }: any) => {
        try {
          setLoadingSubmit(true);

          formRef.current?.setErrors({});
          const schema = Yup.object().shape({
            file: Yup.mixed()

              .test(
                "fileSize",
                "File too large",
                (value) => value && value.size <= FILE_SIZE
              )
              .test(
                "fileFormat",
                "Unsupported Format",
                (value) => value && SUPPORTED_FORMATS.includes(value.type)
              )
              .required("A file is required"),
          });

          await schema.validate(data, { abortEarly: false });

          const formData = new FormData();
          formData.append("file", data.file);

          // const response = await api.post(`/users/invite`, formData);
          // console.log(response);

          setUploading(true);
          const response = await api.post<IRegisteredResponse>(
            "/admin/users/upload",
            formData,
            {
              // headers:{'Content-Type': 'multipart/form-data'},
              timeout: 70000,
              onUploadProgress(progressEvent) {
                const percentCompleted = Math.round(
                  (progressEvent.loaded * 100) / progressEvent.total
                );
                setPercent(percentCompleted);
              },
            }
          );

          setRegistered(response.data);

          // onClose();
          // addToast({
          //   type: "success",
          //   title: "Invitation sent",
          //   description: "The user will receive an email with the invitation",
          // });
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
          setUploading(false);
          setLoadingSubmit(false);
        }
      },
      [addToast]
    );

    const handleDownload = () => {
      const filePath = demoFile;

      const link = document.createElement("a");
      link.href = filePath;
      link.download = "demo.csv";

      link.click();
    };

    useImperativeHandle(ref, () => ({
      openEditModal: (user: IUser) => {
        // loadForm();
        onOpen();
      },
    }));

    const uploadStatus = useCallback(() => {
      return (
        <Flex width={"100%"} alignItems="center" flexDirection="column">
          <VStack flex={1} w={"-moz-max-content"}>
            <Text textColor={"gray.500"}>Uploading...</Text>
            <Progress
              w={"-moz-max-content"}
              colorScheme="green"
              size="sm"
              value={percent}
            />
          </VStack>
        </Flex>
      );
    }, [percent]);

    const uploadForm = () => {
      return (
        <>
          <Link href="#" onClick={handleDownload}>
            <HStack>
              <Text fontSize="sm" color="GrayText">
                Click here to download a demo CSV file{" "}
              </Text>
              <FiDownload />
            </HStack>
          </Link>

          <Form
            // initialData={selectedUser}
            ref={formRef}
            onSubmit={handleSubmit}
            style={{ marginTop: 16 }}
          >
            <InputFile
              name="file"
              icon={FiPlus}
              placeholder="CLICK TO SELECT CSV FILE"
              isLoading={loadingSubmit}
            />
          </Form>
        </>
      );
    };

    const renderRegisteredList = useCallback(() => {
      return (
        <ModalBody>
          <Text
            fontSize="sm"
            color="GrayText"
            hidden={registered.sussecceful?.length === 0}
          >
            The following users were registered successfully:
          </Text>
          <VStack
            justifyContent={"flex-start"}
            alignItems={"flex-start"}
            width="-webkit-max-content"
          >
            {registered.sussecceful?.map((user) => (
              <HStack
                key={user.email}
                justifyContent={"flex-start"}
                alignItems="center"
              >
                <FiUserCheck color="green" />
                <Text>{user.email}</Text>
              </HStack>
            ))}
          </VStack>
          <Divider marginY={2} hidden={registered.sussecceful?.length === 0} />
          <Text fontSize="sm" color="GrayText" hidden={!registered.error}>
            The following users were not registered:
          </Text>
          <VStack
            justifyContent={"flex-start"}
            alignItems={"flex-start"}
            width="-webkit-max-content"
          >
            {registered.error?.map((user) => (
              <HStack
                key={user.email}
                justifyContent={"flex-start"}
                alignItems="center"
              >
                <FiUserX color="red" />
                <Text>{user.email}</Text>
                <Text fontSize="small" color="gray.500">
                  {user.message}
                </Text>
              </HStack>
            ))}
          </VStack>
        </ModalBody>
      );
    }, [registered]);

    return (
      <>
        <Button
          leftIcon={<FiUpload />}
          colorScheme="blue"
          marginX={2}
          onClick={() => {
            setOverlay(<OverlayOne />);
            onOpen();
          }}
        >
          Upload CSV
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
            <ModalHeader>Upload CSV list of users</ModalHeader>
            <ModalCloseButton />
            {registered.error.length === 0 &&
            registered.sussecceful.length === 0 ? (
              <ModalBody>{uploading ? uploadStatus() : uploadForm()}</ModalBody>
            ) : (
              renderRegisteredList()
            )}
            <ModalFooter>
              <Button
                colorScheme="teal"
                isLoading={loadingSubmit}
                onClick={() => formRef.current?.submitForm()}
                hidden={
                  uploading ||
                  registered.sussecceful?.length > 0 ||
                  registered.error?.length > 0
                }
              >
                Send invitation
              </Button>

              <Button
                hidden={
                  uploading ||
                  (registered.sussecceful?.length === 0 &&
                    registered.error?.length === 0)
                }
                variant="outline"
                onClick={() => setRegistered({ error: [], sussecceful: [] })}
                colorScheme="blue"
              >
                Upload new CSV File
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </>
    );
  }
);

export default Upload;
