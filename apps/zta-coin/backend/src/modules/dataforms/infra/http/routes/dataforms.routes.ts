import ensureAuthenticated from '@modules/users/infra/http/middlewares/ensureAuthenticated';
import { celebrate, Joi, Segments } from 'celebrate';
import { Router } from 'express';
import { EnumPrivacy } from '../../typeorm/entities/DataForm';
import DataFormRecordsController from '../controller/DataFormRecordsController';
import DataFormsController from '../controller/DataFormsController';
import DataFormStructuresController from '../controller/DataFormStructuresController';
import syncNodeDataForms from '../middlewares/syncNodeDataForms';
import syncNodeDataFormStructures from '../middlewares/syncNodeDataFormStructures';

const dataFormsRoute = Router();
const dataFormsController = new DataFormsController();
const dataFormStructuresController = new DataFormStructuresController();
const dataFormRecordsController = new DataFormRecordsController();

// Force route to be authenticated
dataFormsRoute.use(ensureAuthenticated);

dataFormsRoute.get(
  '/',
  /* #swagger.path = '/me/dataforms'
     #swagger.operationId = getMyDataForms
     #swagger.tags = ['DataForms']
     #swagger.summary = 'Get My DataForms'
     #swagger.description = 'Get all my data forms.'
     #swagger.security = [{
      "bearerAuth": []
      }]
     #swagger.responses[200] = {
       description: 'DataForms retrieved successfully',
     }
     #swagger.responses[400] = {
        description: 'Bad request',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Exception' } } }
     }
     #swagger.responses[401] = {
        description: 'Unauthorized',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Exception' } } }
     }
     #swagger.responses[403] = {
        description: 'Forbidden',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Exception' } } }
     }
  */
  dataFormsController.index,
);

dataFormsRoute.get(
  '/:id',
  /* #swagger.path = '/me/dataforms/{id}'
     #swagger.operationId = getMyDataFormById
     #swagger.tags = ['DataForms']
     #swagger.summary = 'Get My DataForm by ID'
     #swagger.description = 'Get a data form by its ID.'
     #swagger.security = [{
      "bearerAuth": []
      }]
     #swagger.parameters['id'] = {
       in: 'path',
       name: 'id',
       description: 'SYNC_ID of the data form',
       required: true,
       type: 'string'
     }
     #swagger.responses[200] = {
       description: 'DataForm retrieved successfully',
     }
     #swagger.responses[400] = {
        description: 'Bad request',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Exception' } } }
     }
     #swagger.responses[401] = {
        description: 'Unauthorized',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Exception' } } }
     }
     #swagger.responses[403] = {
        description: 'Forbidden',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Exception' } } }
     }

  */
  dataFormsController.show,
);

dataFormsRoute.post(
  '/',
  /* #swagger.path = '/me/dataforms'
     #swagger.operationId = createMyDataForm
     #swagger.tags = ['DataForms']
     #swagger.summary = 'Create My DataForm'
     #swagger.description = 'Create a new data form.'
     #swagger.security = [{
      "bearerAuth": []
      }]
    #swagger.parameters['params'] ={
    "in": "body",
    "description": "Data form creation information, privacy is public or private",
    "required": true,
    "schema": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string",
          "required": true
        },
        "description": {
          "type": "string",
          "required": false,
        },
        "privacy": {
          "type": "string",
          "enum": ["public", "private"]
        },
        "room_syncid": {
          "type": "string",
          "required": false
        },
        "shared_groups_ids": {
          "type": "array",
          "required": false,
          "items": {
            "type": "string"
          }
        }
      },
      "example": {
        "name": "My Data Form",
        "description": "Description of my data form",
        "privacy": "public",
        "room_syncid": "room_syncid",
        "shared_groups_ids": ["group_id_1", "group_id_2"]
      }
    }
  }
#swagger.responses[201] = {
       description: 'DataForm created successfully',
     }
      #swagger.responses[400] = {
        description: 'Bad request',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Exception' } } }
     }
     #swagger.responses[401] = {
        description: 'Unauthorized',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Exception' } } }
     }
     #swagger.responses[403] = {
        description: 'Forbidden',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Exception' } } }
     }
  */
  celebrate({
    [Segments.BODY]: {
      sync_id: Joi.string(),
      masterNode: Joi.boolean(),
      name: Joi.string().required(),
      description: Joi.string().optional().allow(''),
      room_syncid: Joi.string(),
      privacy: Joi.string().valid(EnumPrivacy.Public, EnumPrivacy.Private),
      shared_groups_ids: Joi.array().items(Joi.string()),
    },
  }),
  syncNodeDataForms,
  dataFormsController.create,
);

dataFormsRoute.put(
  '/:id',
  /* #swagger.path = '/me/dataforms/{id}'
     #swagger.operationId = updateMyDataForm
     #swagger.tags = ['DataForms']
     #swagger.summary = 'Update My DataForm'
     #swagger.description = 'Update an existing data form.'
     #swagger.security = [{
      "bearerAuth": []
      }]
     #swagger.parameters['id'] = {
       in: 'path',
       name: 'id',
       description: 'SYNC_ID of the data form',
       required: true,
       type: 'string'
     }
     #swagger.parameters['params'] = {
        in: 'body',
        description: 'Data form update information, privacy is public or private',
        required: true,
        schema: {
              "name": {
                "type": "string",
                "required": true
              },
              "description": {
                "type": "string",
                "required": false
              },
              "privacy": {
                "type": "string",
                "valid": ["Public", "Private"]
              },
              "shared_groups_ids": {
                "type": "array",
                 "required": false,
                "items": {
                  "type": "string"
                }
              }
        }
     }
     #swagger.responses[200] = {
       description: 'DataForm updated successfully',
     }
     #swagger.responses[400] = {
        description: 'Bad request',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Exception' } } }
     }
     #swagger.responses[401] = {
        description: 'Unauthorized',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Exception' } } }
     }
     #swagger.responses[403] = {
        description: 'Forbidden',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Exception' } } }
     }
  */
  celebrate({
    [Segments.PARAMS]: {
      id: Joi.string().required(),
    },
    [Segments.BODY]: {
      sync_id: Joi.string(),
      masterNode: Joi.boolean(),
      name: Joi.string().required(),
      description: Joi.string().optional().allow(''),
      privacy: Joi.string().valid(EnumPrivacy.Public, EnumPrivacy.Private),
      shared_groups_ids: Joi.array().items(Joi.string()),
    },
  }),
  syncNodeDataForms,
  dataFormsController.update,
);

// STRUCTURES

dataFormsRoute.get(
  '/:id/structures',
  /* #swagger.path = '/me/dataforms/{id}/structures'
     #swagger.operationId = getMyDataFormStructures
     #swagger.tags = ['DataForms']
     #swagger.summary = 'Get My DataForm Structures'
     #swagger.description = 'Get all structures of a data form.'
     #swagger.security = [{
      "bearerAuth": []
      }]
     #swagger.parameters['id'] = {
       in: 'path',
       name: 'id',
       description: 'SYNC_ID of the data form',
       required: true,
       type: 'string'
     }
     #swagger.responses[200] = {
       description: 'DataForm structures retrieved successfully',
     }
     #swagger.responses[400] = {
        description: 'Bad request',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Exception' } } }
     }
     #swagger.responses[401] = {
        description: 'Unauthorized',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Exception' } } }
     }
     #swagger.responses[403] = {
        description: 'Forbidden',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Exception' } } }
     }
  */
  celebrate({
    [Segments.PARAMS]: {
      id: Joi.string().required(),
    },
  }),
  dataFormStructuresController.show,
);

dataFormsRoute.post(
  '/:id/structures',
  /* #swagger.path = '/me/dataforms/{id}/structures'
     #swagger.operationId = createMyDataFormStructure
     #swagger.tags = ['DataForms']
     #swagger.summary = 'Create My DataForm Structure'
     #swagger.description = 'Create a new structure for a data form. Helper BUILDER is available at <a href="https://dev.goknown.app/formbuilder" target="_blank">https://dev.goknown.app/formbuilder</a>'
     #swagger.security = [{
      "bearerAuth": []
      }]
     #swagger.parameters['id'] = {
       in: 'path',
       name: 'id',
       description: 'Dataform SYNC_ID of the data form',
       required: true,
       type: 'string'
     }
     #swagger.parameters['params'] = {
        in: 'body',
        description: 'Data form structure creation information',
        required: true,
        schema: {
          value_json: "json string",
        }
     }
     #swagger.responses[201] = {
       description: 'DataForm structure created successfully',
     }
     #swagger.responses[400] = {
        description: 'Bad request',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Exception' } } }
     }
     #swagger.responses[401] = {
        description: 'Unauthorized',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Exception' } } }
     }
     #swagger.responses[403] = {
        description: 'Forbidden',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Exception' } } }
     }
  */
  celebrate({
    [Segments.PARAMS]: {
      id: Joi.string().required(),
    },
    [Segments.BODY]: {
      sync_id: Joi.string(),
      masterNode: Joi.boolean(),
      value_json: Joi.string().required(),
    },
  }),
  syncNodeDataFormStructures,
  dataFormStructuresController.create,
);

dataFormsRoute.put(
  '/:id/structures',
  /* #swagger.path = '/me/dataforms/{id}/structures'
     #swagger.operationId = updateMyDataFormStructure
     #swagger.tags = ['DataForms']
     #swagger.summary = 'Update My DataForm Structure
     #swagger.description = 'Update an existing structure for a data form.  Helper BUILDER is available at <a href="https://dev.goknown.app/formbuilder" target="_blank">https://dev.goknown.app/formbuilder</a>''
     #swagger.security = [{
      "bearerAuth": []
      }]
     #swagger.parameters['id'] = {
       in: 'path',
       name: 'id',
       description: 'Dataform SYNC_ID of the data form',
       required: true,
       type: 'string'
     }
     #swagger.parameters['params'] = {
        in: 'body',
        description: 'Data form structure update information',
        required: true,
        schema: {
          value_json: "json string",
        }
     }
     #swagger.responses[200] = {
       description: 'DataForm structure updated successfully',
     }
     #swagger.responses[400] = {
        description: 'Bad request',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Exception' } } }
     }
     #swagger.responses[401] = {
        description: 'Unauthorized',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Exception' } } }
     }
     #swagger.responses[403] = {
        description: 'Forbidden',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Exception' } } }
     }
  */
  celebrate({
    [Segments.PARAMS]: {
      id: Joi.string().required(),
    },
    [Segments.BODY]: {
      sync_id: Joi.string(),
      masterNode: Joi.boolean(),
      value_json: Joi.string().required(),
    },
  }),
  syncNodeDataFormStructures,
  dataFormStructuresController.update,
);

// RECORDS
dataFormsRoute.get(
  '/:id/records',
  /* #swagger.path = '/me/dataforms/{id}/records'
     #swagger.operationId = getMyDataFormRecords
     #swagger.tags = ['DataForms']
     #swagger.summary = 'Get My DataForm Records'
     #swagger.description = 'Get all records of a data form.'
     #swagger.security = [{
      "bearerAuth": []
      }]
     #swagger.parameters['id'] = {
       in: 'path',
       name: 'id',
       description: 'SYNC_ID of the data form',
       required: true,
       type: 'string'
     }
     #swagger.responses[200] = {
       description: 'DataForm records retrieved successfully',
     }
     #swagger.responses[400] = {
        description: 'Bad request',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Exception' } } }
     }
     #swagger.responses[401] = {
        description: 'Unauthorized',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Exception' } } }
     }
     #swagger.responses[403] = {
        description: 'Forbidden',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Exception' } } }
     }
  */
  celebrate({
    [Segments.PARAMS]: {
      id: Joi.string().required(),
    },
  }),
  dataFormRecordsController.index,
);

dataFormsRoute.post(
  '/:id/records',
  /* #swagger.path = '/me/dataforms/{id}/records'
     #swagger.operationId = createMyDataFormRecord
     #swagger.tags = ['DataForms']
     #swagger.summary = 'Create My DataForm Record'
     #swagger.description = 'Create a new record for a data form.'
     #swagger.security = [{
      "bearerAuth": []
      }]
     #swagger.parameters['id'] = {
       in: 'path',
       name: 'id',
       description: 'SYNC_ID of the data form',
       required: true,
       type: 'string'
     }
     #swagger.parameters['params'] = {
        in: 'body',
        description: 'Data form record creation information',
        required: true,
        schema: {
          value_json: "json string",
        }
     }
     #swagger.responses[201] = {
       description: 'DataForm record created successfully',
     }
     #swagger.responses[400] = {
        description: 'Bad request',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Exception' } } }
     }
     #swagger.responses[401] = {
        description: 'Unauthorized',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Exception' } } }
     }
     #swagger.responses[403] = {
        description: 'Forbidden',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Exception' } } }
     }
  */
  celebrate({
    [Segments.PARAMS]: {
      id: Joi.string().required(),
    },
    [Segments.BODY]: {
      sync_id: Joi.string(),
      masterNode: Joi.boolean(),
      value_json: Joi.string().required(),
    },
  }),
  syncNodeDataFormStructures,
  dataFormRecordsController.create,
);

export default dataFormsRoute;
