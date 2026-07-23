import Queue from "../../models/Queue";
import Whatsapp from "../../models/Whatsapp";

const ListWhatsAppsService = async (tenantId?: number): Promise<Whatsapp[]> => {
  const where: any = {};
  if (tenantId) {
    where.tenantId = tenantId;
  }
  const whatsapps = await Whatsapp.findAll({
    where,
    include: [
      {
        model: Queue,
        as: "queues",
        attributes: ["id", "name", "color", "greetingMessage"]
      }
    ]
  });

  return whatsapps;
};

export default ListWhatsAppsService;
