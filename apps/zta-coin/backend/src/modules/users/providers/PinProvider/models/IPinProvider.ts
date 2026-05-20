export default interface IPinProvider {
  generatePin(): Promise<string>;
}
