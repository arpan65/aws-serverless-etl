// Import necessary libraries
import { Duration, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as glue from 'aws-cdk-lib/aws-glue';
import { StackConfiguration } from './configs/stack-configuration';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Asset } from "aws-cdk-lib/aws-s3-assets";
import * as lambda from 'aws-cdk-lib/aws-lambda';


import {
  Role,
  ManagedPolicy,
  ServicePrincipal,
  Policy,
  PolicyStatement,
  Effect,
} from "aws-cdk-lib/aws-iam";
import * as path from "path";
import dynamodb=require('aws-cdk-lib/aws-dynamodb');


//set AWS managed policy arn and glue service URL
const glue_managed_policy ="arn:aws:iam::aws:policy/service-role/AWSGlueServiceRole";
const dynamodb_managed_policy ="arn:aws:iam::aws:policy/AmazonDynamoDBReadOnlyAccess";
const glue_ServiceUrl = "glue.amazonaws.com";


export class CdkWorkshopStack extends Stack {
  public readonly glueRole: Role;
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

   // Create a bucket
    const etl_bucket=new Bucket(this,'glue-etl-bucket',{
     bucketName:StackConfiguration.bucketName,
     removalPolicy:RemovalPolicy.DESTROY,
     enforceSSL:true
     
    });
  
     //python scripts to run in Glue job
    const f_pyAssetETL = new Asset(this, "py-asset-etl", {
      path: path.join(__dirname, "assets/glue-cdk-asset-etl.py"),
    });
  
  
  
   
    //create glue cralwer role to access S3 bucket
    const glue_service_role = new Role(this, "glue-crawler-role", {
      roleName: "AWSGlueServiceRole-AccessS3Bucket",
      description:
        "Assigns the managed policy AWSGlueServiceRole to AWS Glue Crawler so it can crawl S3 buckets",
      managedPolicies: [
        ManagedPolicy.fromManagedPolicyArn(
          this,
          "glue-service-policy",
          glue_managed_policy
        ),
        ManagedPolicy.fromManagedPolicyArn(
          this,
          "dynamodb-service-policy",
          dynamodb_managed_policy
        )
        
      ],
      assumedBy: new ServicePrincipal(glue_ServiceUrl),
    });
 
    this.glueRole = glue_service_role;

    //add policy to role to grant access to S3 asset bucket and public buckets
    const iam_policy_forAssets = new Policy(this, "iam-policy-forAssets", {
      force: true,
      policyName: "glue-policy-workflowAssetAccess",
      roles: [glue_service_role],
      statements: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: [
            "s3:GetObject",
            "s3:PutObject",
            "s3:DeleteObject",
            "s3:ListBucket",
          ],
          resources: ["arn:aws:s3:::" + etl_bucket.bucketName+ "/*"],
        }),
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ["s3:GetObject"],
          resources: ["*"],
        }),
      ],
    });
    
    // creating the source table 
    const sourcetable=new dynamodb.Table(this,'etl-glue-source',{
      partitionKey :{name:"policy_id",type:dynamodb.AttributeType.STRING},
      sortKey:{name:"age_of_car",type:dynamodb.AttributeType.STRING},
      tableName:"glue-etl-demo-source",
      removalPolicy:RemovalPolicy.DESTROY
    })

    //create glue crawler to crawl csv files in S3
    const glue_crawler = new glue.CfnCrawler(this, "glue-crawler-dynamoDB", {
      name: "glue-dynamo-crawler",
      role: glue_service_role.roleName,
      targets: {
        dynamoDbTargets:[
          {
            path:sourcetable.tableName
          }
        ]
      },
      databaseName: StackConfiguration.glueCatlogDBName,
      tablePrefix:'demo-',
      schemaChangePolicy: {
        updateBehavior: "UPDATE_IN_DATABASE",
        deleteBehavior: "DEPRECATE_IN_DATABASE",
      },
    });

    // define the arguments
    const job_params={
      '--JOB_NAME':StackConfiguration.glueJobName,
      '--DATABASE_NAME':StackConfiguration.glueCatlogDBName,
      '--TABLE_NAME':StackConfiguration.glueTableName,
      '--BUCKET_PATH':`s3://${etl_bucket.bucketName}/write`
    }

    //create glue job
    const etl_glue_job=new glue.CfnJob(this,'glue-etl-demo-job',{
      role:glue_service_role.roleArn,
      command:{
        name:'glue-etl',
        scriptLocation:f_pyAssetETL.s3ObjectUrl,
        pythonVersion:'3.9',
      },
      defaultArguments:job_params,
      description:'Sample Glue Processing Job from DynamoDB to S3',
      name:StackConfiguration.glueJobName,
      glueVersion:'3.0',
      workerType:'G.1X',
      numberOfWorkers:2,
      timeout:5,
      maxRetries:0
    })
  }
}

