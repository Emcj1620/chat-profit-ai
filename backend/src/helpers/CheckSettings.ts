import Setting from "../models/Setting";
import AppError from "../errors/AppError";

const CheckSettings = async (key: string, tenantId = 1): Promise<string> => {
  let setting = await Setting.findOne({
    where: { key, tenantId }
  });

  if (!setting) {
    setting = await Setting.findOne({
      where: { key }
    });
  }

  if (!setting) {
    return "enabled";
  }

  return setting.value;
};

export default CheckSettings;
