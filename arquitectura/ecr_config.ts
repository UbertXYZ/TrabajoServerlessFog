import * as aws from "@pulumi/aws";
import * as docker from "@pulumi/docker";
import * as path from "path";
import * as pulumi from "@pulumi/pulumi";

export const fogRepo = new aws.ecr.Repository("fogRepo", {
  name: "fog-repo",
  forceDelete: true,
});

const creds = aws.ecr.getAuthorizationTokenOutput({
  registryId: fogRepo.registryId,
});

export const fogImage = new docker.Image("fogImage", {
  imageName: pulumi.interpolate`${fogRepo.repositoryUrl}:latest`,
  build: {
    context: path.resolve(__dirname, "../funciones"),
    platform: "linux/amd64",
  },
  registry: {
    server: fogRepo.repositoryUrl,
    username: creds.userName,
    password: creds.password,
  },
});