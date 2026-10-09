import { VerdocsEndpoint } from "../VerdocsEndpoint";
import {
  IAuthenticateRecipientViaIdRequest,
  ISignerTokenResponse,
} from "./Types";

/**
 * Verify recipient authentication via the Id Capture workflow
 */
export const verifySignerId = (
  endpoint: VerdocsEndpoint,
  params: IAuthenticateRecipientViaIdRequest,
) => {
  const formData = new FormData();
  formData.append("auth_method", "id");
  formData.append("country_code", params.country_code);
  formData.append("document_type", params.document_type);
  formData.append("front_image", params.front_image, "front.jpg");
  formData.append("face_image", params.face_image, "face.jpg");
  if (params.back_image)
    formData.append("back_image", params.back_image, "back.jpg");

  // Upload plus GBG's synchronous processing can exceed the 60s default
  return endpoint.api
    .post<ISignerTokenResponse>(`/v2/sign/verify`, formData, {
      timeout: 120000,
    })
    .then((r) => r.data);
};
