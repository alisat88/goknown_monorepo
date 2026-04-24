export default interface ICreateOrganizationDTO {
  name: string;
  admin_alias?: string;
  avatar?: string;
  owner_id: string;
  sync_id: string;
  enableWallet?: boolean;
}
