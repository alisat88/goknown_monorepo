import { Router } from 'express';
import ensureAuthenticated from '@modules/users/infra/http/middlewares/ensureAuthenticated';
import syncNodeDigitalAsset from '../middlewares/syncNodeDigitalAsset';

import DigitalAssetsController from '../controller/DigitalAssetsController';
import uploadConfig from '@config/upload';
import multer from 'multer';
import UploadDigitalAssetsController from '../controller/UploadDigitalAssetsController';

const upload = multer(uploadConfig.multer);
const digitalAssetsRoute = Router();
const digitalAssetsController = new DigitalAssetsController();
const uploadDigitalAssetsController = new UploadDigitalAssetsController();

// Force route to be authenticated
digitalAssetsRoute.use(ensureAuthenticated);

digitalAssetsRoute.get(
  '/',
  /* #swagger.path = '/me/digitalassets'
     #swagger.operationId = getMyDigitalAssets
     #swagger.tags = ['Digital Assets']
     #swagger.summary = 'Get My Digital Assets'
     #swagger.description = 'Get all my digital assets.'
     #swagger.security = [{
      "bearerAuth": []
      }]
     #swagger.responses[200] = {
       description: 'Digital assets retrieved successfully',
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
  digitalAssetsController.index,
);
digitalAssetsRoute.get(
  '/:id',
  /* #swagger.path = '/me/digitalassets/{id}'
     #swagger.operationId = getMyDigitalAssetById
     #swagger.tags = ['Digital Assets']
     #swagger.summary = 'Get My Digital Asset by ID'
     #swagger.description = 'Get a digital asset by its ID.'
     #swagger.security = [{
      "bearerAuth": []
      }]
     #swagger.parameters['id'] = {
       in: 'path',
       name: 'id',
       description: 'SYNC_ID of the digital asset',
       required: true,
       type: 'string'
     }
     #swagger.responses[200] = {
       description: 'Digital asset retrieved successfully',
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
  digitalAssetsController.show,
);

digitalAssetsRoute.put(
  '/:id',
  /* #swagger.path = '/me/digitalassets/{id}'
     #swagger.operationId = updateMyDigitalAsset
     #swagger.tags = ['Digital Assets']
     #swagger.summary = 'Update My Digital Asset'
     #swagger.description = 'Update an existing digital asset.'
     #swagger.security = [{
      "bearerAuth": []
      }]
     #swagger.parameters['id'] = {
       in: 'path',
       name: 'id',
       description: 'SYNC_ID of the digital asset',
       required: true,
       type: 'string'
     }
     #swagger.parameters['params'] = {
        in: 'body',
        description: 'Digital asset update information, privacy is public or private',
        required: true,
        schema: {
          privacy: 'public',
          description: 'My Digital Asset Description',
          folder_sync_id: 'folder_sync_id',
        }
     }
     #swagger.responses[200] = {
       description: 'Digital asset updated successfully',
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
  syncNodeDigitalAsset,
  digitalAssetsController.update,
);

digitalAssetsRoute.post(
  '/',
  /* #swagger.path = '/me/digitalassets'
     #swagger.operationId = createMyDigitalAsset
     #swagger.tags = ['Digital Assets']
     #swagger.summary = 'Create My Digital Asset'
     #swagger.description = 'Create a new digital asset.'
     #swagger.security = [{
      "bearerAuth": []
      }]
      #swagger.parameters['params'] = {
        in: 'body',
        description: 'Digital asset creation information, privacy is public or private',
        required: true,
        schema: {
            filename: 'filename',
            name: 'name',
            description: 'description',
            folder_sync_id: 'folder_sync_id',
            privacy: 'public',
            room_syncid: "room_syncid"
        }
      }

     #swagger.responses[201] = {
       description: 'Digital asset created successfully',
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
  upload.single('file'),
  syncNodeDigitalAsset,
  uploadDigitalAssetsController.create,
);

// this route is use to sync digital assets without create many files
digitalAssetsRoute.post(
  '/withoutfile',
  /* #swagger.path = '/me/digitalassets/withoutfile'
     #swagger.operationId = createMyDigitalAssetWithoutFile
     #swagger.tags = ['Digital Assets']
     #swagger.summary = 'Create My Digital Asset Without File'
     #swagger.description = 'Create a new digital asset without uploading a file.'
     #swagger.security = [{
      "bearerAuth": []
      }]
      #swagger.parameters['params'] = {
        in: 'body',
        description: "Digital asset creation information, privacy is public or private",
        required: true,
        schema: {
          filename: 'filename',
          name: 'name',
          description: 'description',
          folder_sync_id: 'folder_sync_id',
          privacy: 'public',
          mimeType: 'mimeType',
          filetoken: 'filetoken',
          room_syncid: 'room_syncid'
        }
      }
     #swagger.responses[201] = {
       description: 'Digital asset created successfully',
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
  syncNodeDigitalAsset,
  digitalAssetsController.create,
);

export default digitalAssetsRoute;
