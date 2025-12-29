import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

const role = new aws.iam.Role("lambdaRole", {
  assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
    Service: "lambda.amazonaws.com",
  }),
});
new aws.iam.RolePolicyAttachment("lambdaBasic", {
  role: role.name,
  policyArn: aws.iam.ManagedPolicy.AWSLambdaBasicExecutionRole,
});
const fn = new aws.lambda.Function("cloudFn", {
  runtime: "nodejs18.x",
  handler: "cloud.handler",
  role: role.arn,
  code: new pulumi.asset.AssetArchive({
    "cloud.js": new pulumi.asset.FileAsset("funciones/cloud.js"),
  }),
});
export const cloudUrl = new aws.lambda.FunctionUrl("cloudUrl", {
  functionName: fn.name,
  authorizationType: "NONE",
});
