import { useCallback, useState, useRef, useEffect, useMemo } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { FiEdit, FiPlus, FiTrash, FiX } from "react-icons/fi";
import { GrDrag } from "react-icons/gr";
import { IconBaseProps } from "react-icons/lib";
import { useHistory, useLocation, useParams } from "react-router-dom";
import { v4 as uuid } from "uuid";

import { FormHandles, Scope } from "@unform/core";
import { Form } from "@unform/web";

import Button from "../../../components/Button";
import ButtonBack from "../../../components/ButtonBack";
import Checkbox from "../../../components/Checkbox";
import DatePicker from "../../../components/DatePicker";
import Field from "../../../components/Field";
import Input from "../../../components/Input";
import Radio from "../../../components/Radio";
import TextArea from "../../../components/TextArea";
import Toggle from "../../../components/Toggle";
import { useToast } from "../../../hooks/toast";
import api from "../../../services/api";
import slugify from "../../../utils/slugify";
import { components, IComponentsProps } from "../components";
import { reorder, copy, move, update, remove } from "../helpers";
import { Container } from "../styles";
import {
  ContentBuilder,
  FormBuilder,
  Kiosk,
  Item,
  ItemForm,
  Clone,
  Handle,
  Notice,
  RigthSection,
  ContainerDrag,
  RigthMenu,
  ItemActions,
  GroupProperties,
} from "./styles";

interface IDataFormItem {
  id: string;
  sync_id: string;
  name: string;
}

interface IErrorItem {
  id: string;
  name: string;
  error: boolean;
}

interface ILocationsProps {
  oldPage?: string;
}

export default function FormStructure() {
  const [formSections, setFromSections] = useState({ [uuid()]: [] });
  const [dataForm, setDataForm] = useState({} as IDataFormItem);
  const [openRigthMenu, setOpenRigthMenu] = useState(false);
  const [editable, setEditable] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [loading, setLoading] = useState(true);

  const [errors, setErrors] = useState([] as IErrorItem[]);
  const [selectedComponent, setSelectedComponent] = useState<IComponentsProps>(
    {} as IComponentsProps
  );
  const [selectedFormSection, setSelectedFormSection] = useState<any>();

  // hooks
  const formRef = useRef<FormHandles>(null);
  const formEditRef = useRef<FormHandles>(null);
  const location = useLocation<ILocationsProps>();
  const {
    id: dataFormId,
    idRoom,
    idGroup,
    idOrganization,
  } = useParams<{
    id: string;
    idRoom: string;
    idGroup: string;
    idOrganization: string;
  }>();
  const history = useHistory();
  const { addToast } = useToast();

  const baseNavigationPath = useMemo(() => {
    if (idOrganization && idGroup && idRoom) {
      return `/organizations/${idOrganization}/groups/${idGroup}/rooms/${idRoom}`;
    }
    return "";
  }, [idGroup, idOrganization, idRoom]);

  const onDragEnd = useCallback(
    (result: any) => {
      const { source, destination } = result;

      // console.log("==> result", result);

      // dropped outside the list
      if (!destination) {
        return;
      }
      setSelectedFormSection(destination.droppableId);
      switch (source.droppableId) {
        case destination.droppableId:
          setFromSections({
            ...formSections,
            [destination.droppableId]: reorder(
              formSections[source.droppableId],
              source.index,
              destination.index
            ),
          });
          break;
        case "COMPONENTS":
          setFromSections({
            ...formSections,
            [destination.droppableId]: copy(
              components,
              formSections[destination.droppableId],
              source,
              destination
            ),
          });
          break;
        default:
          setFromSections(
            move(
              formSections[source.droppableId],
              formSections[destination.droppableId],
              source,
              destination
            )
          );
          break;
      }
    },
    [formSections]
  );

  const renderComponent = useCallback((data: IComponentsProps) => {
    switch (data.component) {
      case "title":
        return <h3>{data.label}</h3>;
      case "description":
        return <p>{data.label}</p>;
      case "breakline":
        return <br />;
      case "text":
        return (
          <Input
            type="text"
            name={data.name || ""}
            placeholder={data.placeholder}
            label={data.label}
            // required={data.required}
          />
        );
      case "number":
        return (
          <Input
            type="number"
            name={data.name || ""}
            placeholder={data.placeholder}
            label={data.label}
            // required={data.required}
          />
        );
      case "textarea":
        return (
          <TextArea
            name={data.name || ""}
            placeholder={data.placeholder}
            label={data.label}
          />
        );
      case "date":
        return (
          <DatePicker
            label={data.label}
            placeholderText={data.placeholder}
            name={data.name || ""}
            disabled={false}
          />
        );

      case "radio":
        return (
          <Radio
            direction="column"
            label={data.label}
            name={data.name || ""}
            options={data.options || []}
          />
        );
      case "checkbox":
        return (
          <Checkbox
            columns="1fr 1fr 1fr"
            label={data.label}
            name={data.name || ""}
            options={data.options || []}
          />
        );
      case "toggle":
        return (
          <Toggle
            active={data.switch_alias?.active}
            inactive={data.switch_alias?.inactive}
            showAlias={data.showAlias}
            label={data.label}
            name={data.name || ""}
          />
        );

      default:
        return <></>;
    }
  }, []);

  const handleUpdate = useCallback(
    (value: any, type = "label") => {
      console.log(value);
      switch (type) {
        case "options":
          // eslint-disable-next-line no-case-declarations
          const options = selectedComponent.options?.map((op, index) =>
            index === value.index
              ? { label: value.label, value: value.value }
              : op
          );
          setFromSections(
            update(
              formSections,
              selectedFormSection,
              {
                options,
              },
              selectedComponent
            )
          );
          setSelectedComponent({
            ...selectedComponent,
            options,
          });
          break;

        default:
          setFromSections(
            update(formSections, selectedFormSection, value, selectedComponent)
          );
          setSelectedComponent({
            ...selectedComponent,
            ...value,
          });
          break;
      }
    },
    [formSections, selectedComponent, selectedFormSection]
  );

  const handleAddValue = useCallback(() => {
    const optionValue = {
      options: selectedComponent.options?.concat({
        label: `Option ${selectedComponent.options.length + 1}`,
        value: `option${selectedComponent.options.length + 1}`,
      }),
    };

    setFromSections(
      update(formSections, selectedFormSection, optionValue, selectedComponent)
    );

    setSelectedComponent({
      ...selectedComponent,
      options: optionValue.options,
    });
  }, [formSections, selectedComponent, selectedFormSection]);

  const errorForm = useCallback(
    (name: any, id: any, error: any) => {
      if (error) {
        setErrors([...errors, { name, id, error }]);
        formEditRef.current?.setFieldError(`${name}_${id}`, "Required Field");
        console.log([...errors, { name, id, error }]);
      } else {
        setErrors(
          errors.filter((e) => `${e.name}_${e.id}` !== `${name}_${id}`)
        );

        formEditRef.current?.setFieldError(`${name}_${id}`, "");
      }
    },
    [errors]
  );

  const renderEditComponent = useCallback(() => {
    let DataForm;
    const initialData = {
      [`label_${selectedComponent.id}`]: selectedComponent.label,
      [`name_${selectedComponent.id}`]: selectedComponent.name,
      ...selectedComponent,
    };

    console.log(selectedComponent);
    switch (selectedComponent.component) {
      case "title":
      case "description":
        DataForm = (
          <Input
            name={`label_${selectedComponent.id}`}
            label="Label"
            onChange={(e) => {
              if (e.target.value) {
                handleUpdate({ label: e.target.value });
                errorForm("label", selectedComponent.id, false);
              } else {
                errorForm("label", selectedComponent.id, true);
              }
            }}
          />
        );
        break;
      case "breakline":
        DataForm = <p>This element is unedited.</p>;
        break;
      case "text":
      case "date":
      case "textarea":
      case "number":
        DataForm = (
          <>
            <Input
              name={`label_${selectedComponent.id}`}
              label="Label"
              onChange={(e) => {
                if (e.target.value) {
                  handleUpdate({ label: e.target.value });
                  errorForm("label", selectedComponent.id, false);
                } else {
                  errorForm("label", selectedComponent.id, true);
                }
              }}
            />
            <Input
              name="placeholder"
              label="Placeholder"
              onChange={(e) => handleUpdate({ placeholder: e.target.value })}
            />
            <Input
              name={`name_${selectedComponent.id}`}
              label="API Name (Query key)"
              isDisabled={editable && !selectedComponent.__new}
              onChange={(e) => {
                if (e.target.value) {
                  formEditRef.current?.setFieldValue(
                    "name",
                    slugify(e.target.value)
                  );
                  handleUpdate({
                    name: e.target.value ? slugify(e.target.value) : "",
                  });
                  errorForm("name", selectedComponent.id, false);
                } else {
                  errorForm("name", selectedComponent.id, true);
                }
              }}
            />
            <section>
              <p>Required:</p>
              <Checkbox
                name="required"
                options={[
                  {
                    id: `checkbox_${selectedComponent.id}`,
                    label: "",
                    checked: false,
                  },
                ]}
                columns="1fr"
                handleSelected={(e: any) => {
                  console.log(e);
                  handleUpdate({ required: e.checked });
                }}
              />
            </section>
          </>
        );
        break;
      case "toggle":
        DataForm = (
          <>
            <Input
              name={`label_${selectedComponent.id}`}
              label="Label"
              onChange={(e) => {
                if (e.target.value) {
                  handleUpdate({ label: e.target.value });
                  errorForm("label", selectedComponent.id, false);
                } else {
                  errorForm("label", selectedComponent.id, true);
                }
              }}
            />
            <Input
              name={`name_${selectedComponent.id}`}
              label="API Name (Query key)"
              isDisabled={editable && !selectedComponent.__new}
              onChange={(e) => {
                if (e.target.value) {
                  formEditRef.current?.setFieldValue(
                    "name",
                    slugify(e.target.value)
                  );
                  handleUpdate({
                    name: e.target.value ? slugify(e.target.value) : "",
                  });
                  errorForm("name", selectedComponent.id, false);
                } else {
                  errorForm("name", selectedComponent.id, true);
                }
              }}
            />

            <section>
              <Scope path="switch_alias">
                <Input
                  label="Active position label"
                  name="active"
                  onChange={(e) => {
                    handleUpdate({
                      switch_alias: {
                        active: e.target.value || "",
                        inactive: selectedComponent.switch_alias?.inactive,
                      },
                    });
                  }}
                />
                <Input
                  label="Inactive position label"
                  name="inactive"
                  onChange={(e) => {
                    handleUpdate({
                      switch_alias: {
                        inactive: e.target.value || "",
                        active: selectedComponent.switch_alias?.active,
                      },
                    });
                  }}
                />
              </Scope>
            </section>
            <section>
              <p>Show alias name</p>

              <Checkbox
                name="showAlias"
                options={[
                  {
                    id: `checkbox_alias_${selectedComponent.id}`,
                    label: "",
                    checked: false,
                  },
                ]}
                columns="1fr"
                handleSelected={(e: any) => {
                  console.log(e);
                  handleUpdate({ showAlias: e.checked });
                }}
              />
            </section>
          </>
        );
        break;
      case "radio":
      case "checkbox":
        DataForm = (
          <>
            <Input
              name={`label_${selectedComponent.id}`}
              label="Label"
              onChange={(e) => {
                if (e.target.value) {
                  handleUpdate({ label: e.target.value });
                  errorForm("label", selectedComponent.id, false);
                } else {
                  errorForm("label", selectedComponent.id, true);
                }
              }}
            />
            <Input
              name={`name_${selectedComponent.id}`}
              label="API Name (Query key)"
              isDisabled={editable && !selectedComponent.__new}
              onChange={(e) => {
                if (e.target.value) {
                  formEditRef.current?.setFieldValue(
                    "name",
                    slugify(e.target.value)
                  );
                  handleUpdate({
                    name: e.target.value ? slugify(e.target.value) : "",
                  });
                  errorForm("name", selectedComponent.id, false);
                } else {
                  errorForm("name", selectedComponent.id, true);
                }
              }}
            />
            <section>
              <p>Required:</p>
              <Checkbox
                name="required"
                options={[
                  {
                    id: `checkbox_${selectedComponent.id}`,
                    label: "",
                    checked: false,
                  },
                ]}
                columns="1fr"
                handleSelected={(e: any) => {
                  console.log(e);
                  handleUpdate({ required: e.checked });
                }}
              />
            </section>

            <GroupProperties>
              <header>
                <h3>Data Values:</h3>
                <button onClick={handleAddValue}>
                  <FiPlus />
                  add value
                </button>
              </header>
              {/* <Scope path="options"> */}
              <ul>
                {selectedComponent.options?.map((option, index) => (
                  <li key={index}>
                    <Scope path={`options[${index}]`}>
                      <Input
                        label={`Label ${index + 1}`}
                        name="label"
                        onChange={(e) => {
                          if (e.target.value) {
                            handleUpdate(
                              { ...option, label: e.target.value, index },
                              "options"
                            );
                            // errorForm("label", selectedComponent.id, false);
                          } else {
                            // errorForm("label", selectedComponent.id, true);
                          }
                        }}
                      />
                      <Input
                        label={`Value ${index + 1}`}
                        name="value"
                        onChange={(e) => {
                          if (e.target.value) {
                            formEditRef.current?.setFieldValue(
                              `options[${index}].value`,
                              slugify(e.target.value)
                            );
                            handleUpdate(
                              { ...option, value: e.target.value, index },
                              "options"
                            );
                            // errorForm("label", selectedComponent.id, false);
                          }
                        }}
                      />
                    </Scope>
                  </li>
                ))}
              </ul>
              {/* </Scope> */}
            </GroupProperties>
          </>
        );
        break;
      default:
        DataForm = <></>;
        break;
    }

    return (
      <Form ref={formEditRef} initialData={initialData} onSubmit={() => {}}>
        {DataForm}
      </Form>
    );
  }, [editable, errorForm, handleAddValue, handleUpdate, selectedComponent]);

  useEffect(() => {
    api
      .get(`/me/dataforms/${dataFormId}`)
      .then((response) => {
        setDataForm(response.data);
        console.log(response.data);
      })
      .catch((error: any) =>
        addToast({
          type: "error",
          title: "Error",
          description: error.message || "",
        })
      )
      .finally(() => {
        setLoading(false);
        setEditable(false);
      });

    api.get(`/me/dataforms/${dataFormId}/structures`).then((response) => {
      if (response.data.value_json) {
        const components = JSON.parse(response.data.value_json);
        setEditable(true);
        setFromSections({
          [dataFormId]: components.map((c: IComponentsProps) => ({
            ...c,
            permitRemoveField: false,
          })),
        });
      }
    });
  }, [addToast, dataFormId, history]);

  const renderIcon = useCallback((icon: any) => {
    const IconComponent = icon;
    return <IconComponent />;
  }, []);

  const handleSubmit = useCallback(async () => {
    setLoadingSubmit(true);

    try {
      console.log(dataFormId);
      const value_json = JSON.stringify(
        formSections[selectedFormSection].map(
          ({ __new, ...rest }: IComponentsProps) => rest
        )
      );
      await api.post(`/me/dataforms/${dataFormId}/structures`, {
        value_json,
      });
      history.push(
        location.state?.oldPage
          ? location.state.oldPage
          : `${baseNavigationPath}/dataforms/${dataFormId}/edit`
      );
      addToast({
        type: "success",
        title: "Success",
        description: "Form has been created",
      });
    } catch (error) {
      console.log(error);
    } finally {
      setLoadingSubmit(false);
    }
  }, [
    addToast,
    baseNavigationPath,
    dataFormId,
    formSections,
    history,
    location.state,
    selectedFormSection,
  ]);

  const handleEdit = useCallback(async () => {
    setLoadingSubmit(true);

    try {
      console.log(dataFormId);
      const value_json = JSON.stringify(
        formSections[selectedFormSection].map(
          ({ __new, ...rest }: IComponentsProps) => rest
        )
      );
      // console.log(value_json);
      await api.put(`/me/dataforms/${dataFormId}/structures`, {
        value_json,
      });
      history.push(
        location.state?.oldPage
          ? location.state.oldPage
          : `${baseNavigationPath}/dataforms/${dataFormId}/edit`
      );

      addToast({
        type: "success",
        title: "Success",
        description: "Form has been edited",
      });
    } catch (error: any) {
      console.log(error);
      addToast({
        type: "error",
        title: "Error",
        description: error.response.data.error,
      });
    } finally {
      setLoadingSubmit(false);
    }
  }, [
    addToast,
    baseNavigationPath,
    dataFormId,
    formSections,
    history,
    location.state,
    selectedFormSection,
  ]);

  const handleFormItem = useCallback((item: IComponentsProps, list: string) => {
    setSelectedComponent({} as IComponentsProps);

    setTimeout(() => setOpenRigthMenu(false), 0);
    setTimeout(() => {
      setOpenRigthMenu(true);
      setSelectedComponent(item);
      setSelectedFormSection(list);
    }, 250);
  }, []);

  const handleRemoveItem = useCallback(
    (item: IComponentsProps) => {
      setFromSections(remove(formSections, selectedFormSection, item));
    },
    [formSections, selectedFormSection]
  );

  return (
    <Container mobileHeight={90} height={150}>
      <header>
        <div>
          <ButtonBack
            mobileTitle={"New Group"}
            goTo={
              location.state?.oldPage
                ? location.state.oldPage
                : `${baseNavigationPath}/dataforms/${dataFormId}/edit`
            }
          />
          <Field
            loading={loading}
            tag="h1"
            value={dataForm?.name}
            width={300}
            height={50}
          />
        </div>
      </header>

      <DragDropContext onDragEnd={onDragEnd}>
        <ContentBuilder>
          <FormBuilder>
            {Object.keys(formSections).map((list, i) => {
              // console.log("==> list", list);
              return (
                <Droppable key={list} droppableId={list}>
                  {(provided, snapshot) => (
                    <ContainerDrag
                      ref={provided.innerRef}
                      isDraggingOver={snapshot.isDraggingOver}
                    >
                      <Form ref={formRef} onSubmit={() => {}}>
                        {formSections[list].length ? (
                          formSections[list].map(
                            (item: IComponentsProps, index) => (
                              <Draggable
                                key={item.id}
                                draggableId={item.id.toString()}
                                index={index}
                              >
                                {(provided, snapshot) => (
                                  <ItemForm
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    isDragging={snapshot.isDragging}
                                    style={provided.draggableProps.style}
                                    isErrored={
                                      !!errors.find((err) => err.id === item.id)
                                    }
                                    isSelected={
                                      item.id === selectedComponent.id
                                    }
                                    onClick={() => handleFormItem(item, list)}
                                  >
                                    <Handle {...provided.dragHandleProps}>
                                      <GrDrag />
                                    </Handle>
                                    {renderComponent(item)}
                                    <ItemActions>
                                      <button
                                        onClick={() => setOpenRigthMenu(true)}
                                      >
                                        <FiEdit />
                                      </button>
                                      <button
                                        disabled={!item.permitRemoveField}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleRemoveItem(item);
                                        }}
                                      >
                                        <FiTrash />
                                      </button>
                                    </ItemActions>
                                  </ItemForm>
                                )}
                              </Draggable>
                            )
                          )
                        ) : (
                          <Notice>Drop components here</Notice>
                        )}
                      </Form>
                      {provided.placeholder}
                    </ContainerDrag>
                  )}
                </Droppable>
              );
            })}

            <Button
              onClick={() => {
                editable ? handleEdit() : handleSubmit();
              }}
              disabled={!formSections[selectedFormSection] || errors.length > 0}
              isLoading={loadingSubmit}
            >
              Save Form
            </Button>
          </FormBuilder>
          <RigthSection>
            <Droppable droppableId="COMPONENTS" isDropDisabled={true}>
              {(provided, snapshot) => (
                <>
                  <h3>Form Fields</h3>
                  <Kiosk
                    ref={provided.innerRef}
                    isDraggingOver={snapshot.isDraggingOver}
                  >
                    {components.map((item: IComponentsProps, index) => (
                      <Draggable
                        key={item.id}
                        draggableId={item.id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <>
                            <Item
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              isDragging={snapshot.isDragging}
                              style={provided.draggableProps.style}
                            >
                              {!!item.icon && renderIcon(item.icon)}
                              {item.title}
                            </Item>
                            {snapshot.isDragging && (
                              <Clone>
                                {!!item.icon && renderIcon(item.icon)}
                                {item.title}
                              </Clone>
                            )}
                          </>
                        )}
                      </Draggable>
                    ))}
                  </Kiosk>
                </>
              )}
            </Droppable>
          </RigthSection>
        </ContentBuilder>
      </DragDropContext>
      <RigthMenu opened={openRigthMenu}>
        <header>
          <button
            onClick={() => {
              setOpenRigthMenu(false);
              setSelectedComponent({} as IComponentsProps);
            }}
          >
            <FiX />
          </button>

          <h1>
            {selectedComponent.icon && renderIcon(selectedComponent.icon)}
            {selectedComponent.title}
          </h1>
        </header>

        {renderEditComponent()}
      </RigthMenu>
    </Container>
  );
}
