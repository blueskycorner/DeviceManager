'use strict'

/**
 * Serverless API for devices management
 * @author Benjamin EHLERS
 * @version 1.0.0
 * @license MIT
 */


// Require and init API router module
const app = require('lambda-api')({ version: 'v1.0', base: 'v1' })
const uuid = require('uuid');
const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies

const dynamoDb = new AWS.DynamoDB.DocumentClient();

//----------------------------------------------------------------------------//
// Define Middleware
//----------------------------------------------------------------------------//

  // Add CORS Middleware
  app.use((req,res,next) => {

    // Add default CORS headers for every request
    res.cors()

    // Call next to continue processing
    next()
  })

//----------------------------------------------------------------------------//
// Build API routes
//----------------------------------------------------------------------------//

  // Get
  app.get('/devices/:device_id', (req,res) => {
    const params = {
      TableName: process.env.TABLE_NAME,
      Key: {
        id: req.params.device_id,
      },
    };
  
    // fetch device from the database
    dynamoDb.get(params, (error, result) => {
      // handle potential errors
      if (error) {
        console.error(error);
        return res.status(501).send('Couldn\'t fetch the device.');
      }
  
      res.status(200).send(result.Item)
    });
  })

  // Post
  app.post('/devices', (req,res) => {
    const timestamp = new Date().getTime();

    const params = {
      TableName: process.env.TABLE_NAME,
      Item: {
        id: uuid.v1(),
        name: req.body.name,
        type: req.body.type,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    };

    // write the todo to the database
    dynamoDb.put(params, (error) => {
      // handle potential errors
      if (error) {
        console.error(error);
        return res.status(501).send('Couldn\'t create the device.')
      }

      res.status(200).send(params.Item)
    });
  })

  // Put
  app.put('/devices/:device_id', (req,res) => {
    console.log('device-id: ' + req.params.device_id);
    const timestamp = new Date().getTime();
    
    const params = {
      TableName: process.env.TABLE_NAME,
      Key: {
        'id': req.params.device_id,
      },
      ExpressionAttributeNames: {
        '#devicename': 'name',
        '#devicetype': 'type',
      },
      ExpressionAttributeValues: {
        ':devicename': req.body.name,
        ':devicetype': req.body.type,
        ':updatedAt': timestamp,
      },
      UpdateExpression: 'SET #devicename = :devicename, #devicetype = :devicetype, updatedAt = :updatedAt',
      ReturnValues: 'UPDATED_NEW',
    };
  
    // update the device in the database
    dynamoDb.update(params, (error, result) => {
      // handle potential errors
      if (error) {
        console.error(error);
        return res.status(501).send('Couldn\'t fetch the device.');
      }

      res.status(200).send(result.Attributes)
    });
  })


  // Delete
  app.delete('/devices/:post_id', (req,res) => {
    // Send the response
    res.status(200).json({
      status: 'ok',
      version: req.version,
      auth: req.auth,
      params: req.params
    })
  })


  // Default Options for CORS preflight
  app.options('/*', (req,res) => {
    res.status(200).json({})
  })



//----------------------------------------------------------------------------//
// Main router handler
//----------------------------------------------------------------------------//
module.exports.router = (event, context, callback) => {

  // !!!IMPORTANT: Set this flag to false, otherwise the lambda function
  // won't quit until all DB connections are closed, which is not good
  // if you want to freeze and reuse these connections
  context.callbackWaitsForEmptyEventLoop = false

  // Run the request
  app.run(event,context,callback)

} // end router handler
