import sys
from awsglue.transforms import *
from awsglue.utils import getResolvedOptions
from pyspark.context import SparkContext
from awsglue.context import GlueContext
from awsglue.job import Job

## @params: [JOB_NAME]
args = getResolvedOptions(sys.argv, ['JOB_NAME'])

sc = SparkContext()
glueContext = GlueContext(sc)
spark = glueContext.spark_session
job = Job(glueContext)
job.init(args['JOB_NAME'], args)

datasource0 = glueContext.create_dynamic_frame.from_catalog(database = "aws-blogs-glue-database098234ytb2", table_name = "TYPE_YOUR_DYNAMODB_TABLE_NAME".lower().replace('-', '_'), transformation_ctx = "datasource0")

applymapping1 = ApplyMapping.apply(frame = datasource0, mappings = [("dolocationid", "long", "dolocationid", "long"), ("fare_amount", "double", "fare_amount", "double"), ("ratecodeid", "long", "ratecodeid", "long"), ("lpep_dropoff_datetime", "string", "lpep_dropoff_datetime", "timestamp"), ("vendorid", "long", "vendorid", "long"), ("lpep_pickup_datetime", "string", "lpep_pickup_datetime", "timestamp"), ("passenger_count", "long", "passenger_count", "long"), ("tripid", "long", "tripid", "long"), ("tolls_amount", "double", "tolls_amount", "double"), ("improvement_surcharge", "double", "improvement_surcharge", "double"), ("trip_distance", "double", "trip_distance", "double"), ("trip_type", "long", "trip_type", "long"), ("store_and_fwd_flag", "string", "store_and_fwd_flag", "string"), ("payment_type", "long", "payment_type", "long"), ("total_amount", "double", "total_amount", "double"), ("extra", "double", "extra", "double"), ("tip_amount", "double", "tip_amount", "double"), ("mta_tax", "double", "mta_tax", "double"), ("pulocationid", "long", "pulocationid", "long")], transformation_ctx = "applymapping1")

selectfields2 = SelectFields.apply(frame = applymapping1, paths = ["dolocationid", "fare_amount", "ratecodeid", "lpep_dropoff_datetime", "vendorid", "lpep_pickup_datetime", "passenger_count", "tripid", "tolls_amount", "improvement_surcharge", "trip_distance", "trip_type", "store_and_fwd_flag", "payment_type", "total_amount", "extra", "tip_amount", "mta_tax", "pulocationid"], transformation_ctx = "selectfields2")

resolvechoice3 = ResolveChoice.apply(frame = selectfields2, choice = "MATCH_CATALOG", database = "aws-blogs-glue-database098234ytb2", table_name = "ddb-target-s3-table", transformation_ctx = "resolvechoice3")

resolvechoice4 = ResolveChoice.apply(frame = resolvechoice3, choice = "make_struct", transformation_ctx = "resolvechoice4")

datasink5 = glueContext.write_dynamic_frame.from_catalog(frame = resolvechoice4, database = "aws-blogs-glue-database098234ytb2", table_name = "ddb-target-s3-table", transformation_ctx = "datasink5")
job.commit()