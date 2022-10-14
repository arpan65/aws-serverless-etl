import sys
from awsglue.transforms import *
from awsglue.utils import getResolvedOptions
from pyspark.context import SparkContext
from awsglue.context import GlueContext
from awsglue.job import Job

## @params: [JOB_NAME]
args = getResolvedOptions(sys.argv, ['JOB_NAME','DATABASE_NAME','TABLE_NAME','BUCKET_PATH'])

sc = SparkContext()
glueContext = GlueContext(sc)
spark = glueContext.spark_session
job = Job(glueContext)
job.init(args['JOB_NAME'], args)

datasource0 = glueContext.create_dynamic_frame.from_catalog(database = args['DATABASE_NAME'], 
table_name = args['TABLE_NAME'], transformation_ctx = "datasource0")

applymapping1 = ApplyMapping.apply(frame = datasource0, 
mappings = [("orderId", "string", "orderId", "string"),("itemId", "string", "itemId", "string")], transformation_ctx = "applymapping1")

s3bucket_node=glueContext.write_dynamic_frame.from_options(
        frame=applymapping1,
        connection_type="s3",
        format="json",
        connection_options={"path":args['BUCKET_PATH'],"patitionKeys":[]},
        transformation_ctx="S3bucket_node"
)
job.commit()