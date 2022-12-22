# Serverless ETL using AWS Glue

In this use case, we have developed a sample data pipeline (Glue Job) using the AWS typescript SDK, which will read the data from a dynamo DB table, perform some data transformation using PySpark and write it into an S3 bucket in CSV format. 

DynamoDB is a fully managed NoSQL database service offered by AWS, which is easily scalable and used in multiple applications. On the other hand, S3 is a general-purpose storage offering by AWS.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template


## How to reproduce
Prerequisited - you should have an AWS account (free tier is enough) and AWS CLI should have already configured (https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html)

1. Clone the repository
2. Bootstap your AWS environment using - CDK Bootstrap
3. Deploy the stack using - CDK Deploy
4. Create dummy data in dynamoDB using the sample data
5. Run the Glue job from AWS console

The Glue job can be configured from the stack 

## Demo
https://vimeo.com/677054610
