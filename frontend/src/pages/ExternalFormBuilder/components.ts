import { AiOutlineNumber } from "react-icons/ai";
import { BiCheckboxChecked, BiRadioCircleMarked } from "react-icons/bi";
import {
  BsCalendar2Date,
  BsFileBreak,
  BsInputCursorText,
  BsTextareaResize,
  BsToggleOff,
} from "react-icons/bs";
import { ImParagraphLeft } from "react-icons/im";
import { IconBaseProps } from "react-icons/lib";
import { MdTitle } from "react-icons/md";
import { v4 as uuid } from "uuid";

interface IOptionsProps {
  [key: string]: string;
}

interface ISwitchAliasNameProps {
  active: string;
  inactive: string;
}
interface IComponentsProps {
  id: string;
  title: string;
  label: string;
  placeholder?: string;
  // key?: string;
  name?: string;
  component:
    | "title"
    | "description"
    | "breakline"
    | "text"
    | "textarea"
    | "radio"
    | "number"
    | "toggle"
    | "date"
    | "checkbox";
  type: "data" | "label";
  permitRemoveField?: boolean;
  // icon: React.ComponentType<IconBaseProps>;
  icon: any;
  options?: IOptionsProps[];
  switch_alias?: ISwitchAliasNameProps;
  showAlias?: boolean;
  required?: boolean;
  __new?: boolean;
}

const components: IComponentsProps[] = [
  {
    id: uuid(),
    title: "Title",
    label: "Title",
    icon: MdTitle,
    component: "title",
    type: "label",
    permitRemoveField: true,
  },
  {
    id: uuid(),
    title: "Description",
    label: "this is custom text used to write something",
    icon: ImParagraphLeft,
    component: "description",
    type: "label",
    permitRemoveField: true,
  },
  {
    id: uuid(),
    title: "Break Line",
    label: "",
    icon: BsFileBreak,
    component: "breakline",
    type: "label",
    permitRemoveField: true,
  },
  {
    id: uuid(),
    icon: BsInputCursorText,
    title: "Input Text",
    label: "Input Text",
    component: "text",
    type: "data",
    placeholder: "Placeholder",
    required: false,
    permitRemoveField: true,
  },
  {
    id: uuid(),
    icon: AiOutlineNumber,
    title: "Input Number",
    label: "Input Number",
    component: "number",
    type: "data",
    placeholder: "Placeholder",
    required: false,
    permitRemoveField: true,
  },
  {
    id: uuid(),
    icon: BsTextareaResize,
    title: "Text Area",
    label: "Text Area",
    component: "textarea",
    type: "data",
    placeholder: "Placeholder",
    required: false,
    permitRemoveField: true,
  },
  {
    id: uuid(),
    icon: BsCalendar2Date,
    title: "Date Picker",
    label: "Date Picker",
    component: "date",
    type: "data",
    placeholder: "Placeholder",
    required: false,
    permitRemoveField: true,
  },
  {
    id: uuid(),
    icon: BsToggleOff,
    title: "Toggle",
    label: "Toggle",
    component: "toggle",
    type: "data",
    required: false,
    permitRemoveField: true,
    switch_alias: {
      active: "true",
      inactive: "false",
    },
  },
  {
    id: uuid(),
    icon: BiRadioCircleMarked,
    label: "Radio",
    title: "Radio",
    component: "radio",
    type: "data",
    required: false,
    permitRemoveField: true,
    options: [
      {
        label: "option1",
        value: "Option 1",
      },
    ],
  },
  {
    id: uuid(),
    icon: BiCheckboxChecked,
    label: "Checkbox",
    title: "Checkbox",
    component: "checkbox",
    type: "data",
    required: false,
    permitRemoveField: true,
    options: [
      {
        label: "option1",
        value: "Option 1",
      },
    ],
  },
];

export { components };
export type { IComponentsProps };
