// Import necessary libraries
import { Duration, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as glue from 'aws-cdk-lib/aws-glue';
import { StackConfiguration } from './configs/stack-configuration';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Asset } from "aws-cdk-lib/aws-s3-assets";
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
import { TableEncryption } from 'aws-cdk-lib/aws-dynamodb';

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
     removalPolicy:RemovalPolicy.DESTROY
     
    });
  
     //python scripts run in Glue Workflow
    const f_pyAssetETL = new Asset(this, "py-asset-etl", {
      path: path.join(__dirname, "assets/glue-cdk-asset-etl.py"),
    });
  
   
   
   
    //create glue cralwer role to access S3 bucket
    const glue_crawler_role = new Role(this, "glue-crawler-role", {
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
 
    this.glueRole = glue_crawler_role;

    //add policy to role to grant access to S3 asset bucket and public buckets
    const iam_policy_forAssets = new Policy(this, "iam-policy-forAssets", {
      force: true,
      policyName: "glue-policy-workflowAssetAccess",
      roles: [glue_crawler_role],
      statements: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: [
            "s3:GetObject",
            "s3:PutObject",
            "s3:DeleteObject",
            "s3:ListBucket",
          ],
          resources: ["arn:aws:s3:::" + f_pyAssetETL.s3BucketName + "/*"],
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
      partitionKey :{name:"Order_Id",type:dynamodb.AttributeType.STRING},
      sortKey:{name:"Item_Id",type:dynamodb.AttributeType.STRING},
      tableName:"glue-etl-demo-source",
      removalPolicy:RemovalPolicy.DESTROY
    })

    //create glue crawler to crawl csv files in S3
    const glue_crawler_s3 = new glue.CfnCrawler(this, "glue-crawler-s3", {
      name: "s3-csv-crawler",
      role: glue_crawler_role.roleName,
      targets: {
        dynamoDbTargets:[
          {
            path:sourcetable.tableName
          }
        ]
      },
      databaseName: 'glue-etl-demo',
      tablePrefix:'demo-',
      schemaChangePolicy: {
        updateBehavior: "UPDATE_IN_DATABASE",
        deleteBehavior: "DEPRECATE_IN_DATABASE",
      },
    });
  
   
  
  
  }
}
