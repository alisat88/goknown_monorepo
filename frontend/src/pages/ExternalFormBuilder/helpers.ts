import { v4 as uuid } from "uuid";

import slugify from "../../utils/slugify";
import { IComponentsProps } from "./components";

interface ISourceProps {
  [x: string]: never[];
}

// a little function to help us with reordering the result
const reorder = (list: any[], startIndex: number, endIndex: number) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  return result;
};

// Moves an item from one list to another list.
const copy = (
  source: IComponentsProps[],
  destination: any,
  droppableSource: any,
  droppableDestination: any
) => {
  const sourceClone = Array.from(source);
  const destClone = Array.from(destination);
  const item = sourceClone[droppableSource.index];

  destClone.splice(droppableDestination.index, 0, {
    ...item,
    id: uuid(),
    // name: item.type === "data" ? `${item.component}_${uuid()}` : null,
    name:
      item.type === "data"
        ? slugify(`${item.label}_${droppableDestination.index}`)
        : null,
    __new: true,
    options: item.options?.map((op: any, opxIndex) => ({
      ...op,
      value: slugify(`${op.label}`),
    })),
  } as IComponentsProps);
  return destClone;
};

const move = (
  source: IComponentsProps[],
  destination: IComponentsProps[],
  droppableSource: any,
  droppableDestination: any
) => {
  const sourceClone = Array.from(source);
  const destClone = Array.from(destination);
  const [removed] = sourceClone.splice(droppableSource.index, 1);

  destClone.splice(droppableDestination.index, 0, removed);

  const result = {} as any;
  result[droppableSource.droppableId] = sourceClone;
  result[droppableDestination.droppableId] = destClone;

  return result;
};

const update = (
  source: ISourceProps,
  formSection: any,
  value: any,
  item: IComponentsProps
): ISourceProps => {
  return {
    ...source,
    [formSection]: source[formSection].map((data: IComponentsProps) =>
      data.id === item.id
        ? {
            ...data,
            ...value,
          }
        : data
    ),
  };
};

const remove = (
  source: ISourceProps,
  formSection: any,
  item: IComponentsProps
): ISourceProps => {
  return {
    ...source,
    [formSection]: source[formSection].filter(
      (data: IComponentsProps) => data.id !== item.id
    ),
  };
};

export { reorder, copy, move, update, remove };
