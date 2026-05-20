import React from "react";
import { Switch } from "react-router-dom";

import Auditlogs from "../pages/Auditlogs";
import BuyTokens from "../pages/BuyTokens";
import Changelog from "../pages/Changelog";
import Chat from "../pages/Chats";
import ConfirmEmail from "../pages/ConfirmEmail";
import Dashboard from "../pages/Dashboard";
import DataForm from "../pages/DataForms";
import EditDataForm from "../pages/DataForms/edit";
import DataFormCollect from "../pages/DataForms/FormCollect";
import DataFormRecord from "../pages/DataForms/FormRecord";
import DataFormStructure from "../pages/DataForms/FormStructure";
import CreateDataForm from "../pages/DataForms/store";
import DigitalAssets from "../pages/DigitalAssets";
import DigitalAssetsCreate from "../pages/DigitalAssets/create";
import DigitalAssetsEdit from "../pages/DigitalAssets/edit";
import Folder from "../pages/DigitalAssets/Folder";
import FolderPreview from "../pages/DigitalAssets/Folder/preview";
import DigitalAssetsPreview from "../pages/DigitalAssets/preview";
import ExternalFormBuilder from "../pages/ExternalFormBuilder";
import ForgotPassword from "../pages/ForgotPassword";
import Groups from "../pages/Groups";
import GroupsStore from "../pages/Groups/store";
import InviteUser from "../pages/InviteUser";
import Laboratory from "../pages/Laboratory";
import Messenger from "../pages/Messenger";
import Organizations from "../pages/Organizations";
import EditOrganization from "../pages/Organizations/edit";
import OrgazinationsGroupsAdmin from "../pages/Organizations/GroupAdmin/Invitation";
import OrganizationsGroups from "../pages/Organizations/Groups";
import EditOrganizationsGroups from "../pages/Organizations/Groups/edit";
import GroupUsers from "../pages/Organizations/GroupUsers/Invitation";
import OrganizationsRooms from "../pages/Organizations/Rooms";
import RoomsDashboard from "../pages/Organizations/Rooms/Dashboard";
import EditOrganizationsRooms from "../pages/Organizations/Rooms/edit";
import Payments from "../pages/Payments"; // ✅ ADD THIS
import PrivacyPolicy from "../pages/PrivacyPolicy";
import Profile from "../pages/Profile";
import ResetPassword from "../pages/ResetPassword";
import SendToken from "../pages/SendTokens";
import SignIn from "../pages/SignIn";
import SignUp from "../pages/SignUp";
import Transaction from "../pages/Transaction";
import { TwoFactorSMS } from "../pages/TwoFactorSMS";
import Workflow from "../pages/Workflow";
import Route from "./Route";

const Routes: React.FC<React.PropsWithChildren<unknown>> = () => (
  <Switch>
    <Route path="/" exact component={SignIn} />
    <Route path="/signup" exact component={SignUp} />
    <Route path="/forgot-password" exact component={ForgotPassword} />
    <Route path="/reset-password" exact component={ResetPassword} />
    <Route path="/confirm-email" exact component={ConfirmEmail} />
    <Route path="/privacy-policy" exact component={PrivacyPolicy} />

    <Route path="/dashboard" exact component={Dashboard} isPrivate />
    <Route path="/profile" exact component={Profile} isPrivate />
    <Route path="/changelog" exact component={Changelog} isPrivate />

    <Route
      path="/digitalassets/new"
      exact
      component={DigitalAssetsCreate}
      isPrivate
    />
    <Route
      path="/digitalassets/:id/preview"
      exact
      component={DigitalAssetsPreview}
      isPrivate
    />
    <Route
      path="/digitalassets/:id/edit"
      exact
      component={DigitalAssetsEdit}
      isPrivate
    />
    <Route
      path="/digitalassets/folders/:id"
      exact
      component={FolderPreview}
      isPrivate
    />
    <Route
      path="/digitalassets/folders/:id/edit"
      exact
      component={Folder}
      isPrivate
    />
    <Route path="/digitalassets" exact component={DigitalAssets} isPrivate />

    <Route path="/transactions" exact component={Transaction} isPrivate />
    <Route path="/trasactions" exact component={Transaction} isPrivate />
    <Route path="/buytokens" exact component={BuyTokens} isPrivate />
    <Route path="/sendtokens" exact component={SendToken} isPrivate />

    <Route path="/groups/new" exact component={GroupsStore} isPrivate />
    <Route
      path="/groups/:groupId/edit"
      exact
      component={GroupsStore}
      isPrivate
    />
    <Route path="/groups" exact component={Groups} isPrivate />

    <Route path="/dataforms/new" exact component={CreateDataForm} isPrivate />
    <Route
      path="/dataforms/:dataFormId/edit"
      exact
      component={EditDataForm}
      isPrivate
    />
    <Route
      path="/dataforms/:dataFormId/collect"
      exact
      component={DataFormCollect}
      isPrivate
    />
    <Route
      path="/dataforms/:dataFormId/records"
      exact
      component={DataFormRecord}
      isPrivate
    />
    <Route
      path="/dataforms/:dataFormId/structure"
      exact
      component={DataFormStructure}
      isPrivate
    />
    <Route path="/dataforms" exact component={DataForm} isPrivate />

    <Route
      path="/organizations/:idOrganization/groupsadmins"
      exact
      component={OrgazinationsGroupsAdmin}
      isPrivate
    />
    <Route
      path="/organizations/:idOrganization/groups/:idGroup/rooms/:idRoom/users"
      exact
      component={GroupUsers}
      isPrivate
    />
    <Route
      path="/organizations/:idOrganization/groups/:idGroup/rooms/:idRoom/dashboard"
      exact
      component={RoomsDashboard}
      isPrivate
    />
    <Route
      path="/organizations/:idOrganization/groups/:idGroup/rooms/:idRoom/edit"
      exact
      component={EditOrganizationsRooms}
      isPrivate
    />
    <Route
      path="/organizations/:idOrganization/groups/:idGroup/rooms/new"
      exact
      component={EditOrganizationsRooms}
      isPrivate
    />
    <Route
      path="/organizations/:idOrganization/groups/:idGroup/rooms/:idRoom/digitalassets/new"
      exact
      component={DigitalAssetsCreate}
      isPrivate
    />
    <Route
      path="/organizations/:idOrganization/groups/:idGroup/rooms/:idRoom/digitalassets/:id/preview"
      exact
      component={DigitalAssetsPreview}
      isPrivate
    />
    <Route
      path="/organizations/:idOrganization/groups/:idGroup/rooms/:idRoom/digitalassets/:id/edit"
      exact
      component={DigitalAssetsEdit}
      isPrivate
    />
    <Route
      path="/organizations/:idOrganization/groups/:idGroup/rooms/:idRoom/digitalassets"
      exact
      component={DigitalAssets}
      isPrivate
    />
    <Route
      path="/organizations/:idOrganization/groups/:idGroup/rooms/:idRoom/dataforms/new"
      exact
      component={CreateDataForm}
      isPrivate
    />
    <Route
      path="/organizations/:idOrganization/groups/:idGroup/rooms/:idRoom/dataforms/:dataFormId/edit"
      exact
      component={EditDataForm}
      isPrivate
    />
    <Route
      path="/organizations/:idOrganization/groups/:idGroup/rooms/:idRoom/dataforms/:dataFormId/collect"
      exact
      component={DataFormCollect}
      isPrivate
    />
    <Route
      path="/organizations/:idOrganization/groups/:idGroup/rooms/:idRoom/dataforms/:dataFormId/records"
      exact
      component={DataFormRecord}
      isPrivate
    />
    <Route
      path="/organizations/:idOrganization/groups/:idGroup/rooms/:idRoom/dataforms/:dataFormId/structure"
      exact
      component={DataFormStructure}
      isPrivate
    />
    <Route
      path="/organizations/:idOrganization/groups/:idGroup/rooms/:idRoom/dataforms"
      exact
      component={DataForm}
      isPrivate
    />
    <Route
      path="/organizations/:idOrganization/groups/:idGroup/rooms/:idRoom/messenger"
      exact
      component={Chat}
      isPrivate
    />
    <Route
      path="/organizations/:idOrganization/groups/:idGroup/rooms/:idRoom/transactions"
      exact
      component={Transaction}
      isPrivate
    />
    <Route
      path="/organizations/:idOrganization/groups/:idGroup/rooms/:idRoom/trasactions"
      exact
      component={Transaction}
      isPrivate
    />
    <Route
      path="/organizations/:idOrganization/groups/:idGroup/rooms/:idRoom/buytokens"
      exact
      component={BuyTokens}
      isPrivate
    />
    <Route
      path="/organizations/:idOrganization/groups/:idGroup/rooms/:idRoom/sendtokens"
      exact
      component={SendToken}
      isPrivate
    />
    <Route
      path="/organizations/:idOrganization/groups/:idGroup/rooms"
      exact
      component={OrganizationsRooms}
      isPrivate
    />
    <Route
      path="/organizations/:idOrganization/groups/:idGroup/edit"
      exact
      component={EditOrganizationsGroups}
      isPrivate
    />
    <Route
      path="/organizations/:idOrganization/groups/new"
      exact
      component={EditOrganizationsGroups}
      isPrivate
    />
    <Route
      path="/organizations/:idOrganization/groups"
      exact
      component={OrganizationsGroups}
      isPrivate
    />
    <Route
      path="/organizations/new"
      exact
      component={EditOrganization}
      isPrivate
    />
    <Route
      path="/organizations/:idOrganization/edit"
      exact
      component={EditOrganization}
      isPrivate
    />
    <Route path="/organizations" exact component={Organizations} isPrivate />

    <Route path="/messenger" exact component={Messenger} isPrivate />
    <Route path="/auditlogs" exact component={Auditlogs} isPrivate />
    <Route path="/users" exact component={InviteUser} isPrivate />
    <Route path="/labs" exact component={Laboratory} isPrivate />

    <Route path="/payments" component={Payments} isPrivate />
    <Route path="/workflow" component={Workflow} isPrivate />
  </Switch>
);

export default Routes;
