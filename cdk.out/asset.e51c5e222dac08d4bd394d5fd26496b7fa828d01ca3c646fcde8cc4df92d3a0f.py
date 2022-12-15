import sys
from awsglue.transforms import *
from awsglue.utils import getResolvedOptions
from pyspark.context import SparkContext
from awsglue.context import GlueContext
from awsglue.job import Job
from awsglue.dynamicframe import DynamicFrame

## @params: [JOB_NAME]
args = getResolvedOptions(sys.argv, ['JOB_NAME','DATABASE_NAME','TABLE_NAME','BUCKET_PATH'])
# initialize the glue context and spark session
sc = SparkContext()
glueContext = GlueContext(sc)
spark = glueContext.spark_session
job = Job(glueContext)
job.init(args['JOB_NAME'], args)
# create dynamic frame from the database table
datasource0 = glueContext.create_dynamic_frame.from_catalog(database = args['DATABASE_NAME'], 
table_name = args['TABLE_NAME'], transformation_ctx = "datasource0")
# convert the dynamic frame to pyspark dataframe
data_frame = datasource0.toDF()
# select a subset of columns
data_frame=data_frame[["policy_id","policy_tenure","make","model","age_of_car","is_claim"]]
# sort of dataframe by age of car
data_frame=data_frame.orderBy(col("age_of_car").desc())
# filter the cars - choose only those where age<0.7
data_frame=data_frame.filter(data_frame.age_of_car<0.7)
data_frame = data_frame.repartition(1)
# convert the pyspark dataframe back to dynamic frame
dynamic_frame_write = DynamicFrame.fromDF(data_frame, glueContext, "dynamic_frame_write")
# write the data to s3
s3bucket_node=glueContext.write_dynamic_frame.from_options(
        frame=dynamic_frame_write,
        connection_type="s3",
        format="csv",
        connection_options={"path":args['BUCKET_PATH']},
        transformation_ctx="S3bucket_node"
)
job.commit()