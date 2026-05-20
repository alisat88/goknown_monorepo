export default interface ISMSTwoFactorProvider {
  generate(phone: string): Promise<void>;
  verify(number: string, code: string): Promise<boolean>;
}
