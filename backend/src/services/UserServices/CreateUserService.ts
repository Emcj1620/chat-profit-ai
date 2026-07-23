import * as Yup from "yup";

import AppError from "../../errors/AppError";
import { SerializeUser } from "../../helpers/SerializeUser";
import User from "../../models/User";
import Tenant from "../../models/Tenant";
import Setting from "../../models/Setting";

interface Request {
  email: string;
  password: string;
  name: string;
  queueIds?: number[];
  profile?: string;
  whatsappId?: number;
  tenantId?: number;
}

interface Response {
  email: string;
  name: string;
  id: number;
  profile: string;
}

const CreateUserService = async ({
  email,
  password,
  name,
  queueIds = [],
  profile = "admin",
  whatsappId,
  tenantId
}: Request): Promise<Response> => {
  const schema = Yup.object().shape({
    name: Yup.string().required().min(2),
    email: Yup.string()
      .email()
      .required()
      .test(
        "Check-email",
        "An user with this email already exists.",
        async value => {
          if (!value) return false;
          const emailExists = await User.findOne({
            where: { email: value }
          });
          return !emailExists;
        }
      ),
    password: Yup.string().required().min(5)
  });

  try {
    await schema.validate({ email, password, name });
  } catch (err) {
    throw new AppError(err.message);
  }

  let actualTenantId = tenantId;

  if (!actualTenantId) {
    // Public signup: create a new tenant
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const tenant = await Tenant.create({
      name: `${name}'s Company`,
      subscriptionStatus: "trialing",
      dueDate: sevenDaysFromNow,
      maxUsers: 3,
      maxConnections: 1,
      planId: 1
    });
    actualTenantId = tenant.id;

    // Initialize default settings for this new tenant
    await Setting.create({
      key: "userCreation",
      value: "enabled",
      tenantId: actualTenantId
    });
    await Setting.create({
      key: "apiToken",
      value: "",
      tenantId: actualTenantId
    });
    await Setting.create({
      key: "primaryColor",
      value: "#2576d2",
      tenantId: actualTenantId
    });
    await Setting.create({
      key: "secondaryColor",
      value: "#1565c0",
      tenantId: actualTenantId
    });
    await Setting.create({
      key: "appName",
      value: `${name}'s System`,
      tenantId: actualTenantId
    });
    await Setting.create({
      key: "appLogoLight",
      value: "",
      tenantId: actualTenantId
    });
    await Setting.create({
      key: "appLogoDark",
      value: "",
      tenantId: actualTenantId
    });
    await Setting.create({
      key: "appFavicon",
      value: "",
      tenantId: actualTenantId
    });
  } else {
    // Check user limit for existing tenant
    const tenant = await Tenant.findByPk(actualTenantId);
    if (tenant && tenant.maxUsers !== -1) {
      const userCount = await User.count({ where: { tenantId: actualTenantId } });
      if (userCount >= tenant.maxUsers) {
        throw new AppError("ERR_USER_LIMIT_EXCEEDED", 400);
      }
    }
  }

  const user = await User.create(
    {
      email,
      password,
      name,
      profile,
      whatsappId: whatsappId ? whatsappId : null,
      tenantId: actualTenantId
    },
    { include: ["queues", "whatsapp"] }
  );

  await user.$set("queues", queueIds);

  await user.reload();

  return SerializeUser(user);
};

export default CreateUserService;
