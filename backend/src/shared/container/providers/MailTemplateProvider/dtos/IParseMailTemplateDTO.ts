interface ITemplateVariables {
  [key: string]: string | number; // criando objecto {}
}

export default interface IParseMailTemplateDTO {
  file: string;
  variables: ITemplateVariables;
}
