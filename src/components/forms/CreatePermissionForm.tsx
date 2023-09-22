
import {Permissions} from "../../database";
import React from "react";
import {SubmitHandler} from "react-hook-form";
import {toast} from "react-hot-toast";
import * as z from "zod";
import withAuthorization from "../hocs/withAuthorization";
import DynamicForm from "./Form";

const PermissionSchema = z.object({
  name: z.string().min(3),
  description: z.string().min(5).describe('textarea'),
});

const CreatePermissionForm = () => {
  const handleCreatePermission: SubmitHandler<
    z.infer<typeof PermissionSchema>
  > = async (data) => {
    const doc = Permissions.doc(data.name.toLowerCase().replace(/\s/g, "_"));
    doc.data = data;
    if ((await doc.get()).exists()) {
      return toast.error(`Permission "${data.name}" exists.`);
    }
    doc
      .save()
      .then(() => {
        toast.success(`Permission ${data.name} was added`);
      })
      .catch((e) => {
        toast.success(`FAILED:  ${e.message}`);
      });
  };
  return (
    <DynamicForm onSubmit={handleCreatePermission} schema={PermissionSchema} />
  );
};

export default withAuthorization({requiredClaims: {superAdmin: true}})(
  CreatePermissionForm
);
