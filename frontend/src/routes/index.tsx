import React from "react";
import { Switch } from "react-router-dom";

import Auditlogs from "../pages/Auditlogs";
import BuyTokens from "../pages/BuyTokens";
import Changelog from "../pages/Changelog";
import Chat from "../pages/Chats";
import ConfirmEmail from "../pages/ConfirmEmail";
import Dashboard from "../pages/Dashboard";
import Payments from "../pages/Payments"; // ✅ ADD THIS
import Workflow from "../pages/Workflow";
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
import PrivacyPolicy from "../pages/PrivacyPolicy";
import Profile from "../pages/Profile";
import ResetPassword from "../pages/ResetPassword";
import SendToken from "../pages/SendTokens";
import SignIn from "../pages/SignIn";
import SignUp from "../pages/SignUp";
import Transaction from "../pages/Transaction";
import { TwoFactorSMS } from "../pages/TwoFactorSMS";
import Route from "./Route";

const Routes: React.FC<React.PropsWithChildren<unknown>> = () => (
  <Switch>
    <Route path="/" exact component={SignIn} />

    <Route path="/dashboard" component={Dashboard} isPrivate />

    {/* ✅ ADD THIS ROUTE */}
    <Route path="/payments" component={Payments} isPrivate />
    <Route path="/workflow" component={Workflow} isPrivate />

    {/* rest unchanged... */}
  </Switch>
);

export default Routes;
