import React, { useState, useEffect, useRef } from "react";
import { useParams, useHistory } from "react-router-dom";
import {
  makeStyles,
  Paper,
  Button,
  IconButton,
  TextField,
  Typography,
  Switch,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Grid,
  Tooltip
} from "@material-ui/core";
import {
  ArrowBack as BackIcon,
  Save as SaveIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  SettingsBackupRestore as ResetIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  QuestionAnswer as MsgIcon,
  Input as InputIcon,
  HelpOutline as ConditionIcon,
  Star as ActionIcon,
  Schedule as TimerIcon,
  CloudQueue as ApiIcon,
  Publish as ImportIcon,
  GetApp as ExportIcon
} from "@material-ui/icons";
import { toast } from "react-toastify";
import api from "../../services/api";

const NODE_WIDTH = 220;
const NODE_HEIGHT = 90;

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    height: "92vh",
    backgroundColor: "#F4F6F9",
    overflow: "hidden"
  },
  topbar: {
    height: "60px",
    backgroundColor: "#FFFFFF",
    borderBottom: "1px solid #E0E0E0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 24px",
    zIndex: 10
  },
  titleArea: {
    display: "flex",
    alignItems: "center",
    gap: "16px"
  },
  mainArea: {
    display: "flex",
    flex: 1,
    position: "relative",
    overflow: "hidden"
  },
  sidebarLeft: {
    width: "240px",
    backgroundColor: "#FFFFFF",
    borderRight: "1px solid #E0E0E0",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    zIndex: 5
  },
  canvasContainer: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
    cursor: "grab"
  },
  canvasActive: {
    cursor: "grabbing"
  },
  canvas: {
    position: "absolute",
    width: "5000px",
    height: "5000px",
    backgroundImage: "radial-gradient(circle, #D1D5DB 1.5px, transparent 1.5px)",
    backgroundSize: "20px 20px",
    transformOrigin: "top left"
  },
  sidebarRight: {
    width: "340px",
    backgroundColor: "#FFFFFF",
    borderLeft: "1px solid #E0E0E0",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    overflowY: "auto",
    zIndex: 5
  },
  node: {
    position: "absolute",
    width: `${NODE_WIDTH}px`,
    borderRadius: "12px",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
    border: "2px solid transparent",
    cursor: "move",
    backgroundColor: "#FFFFFF",
    overflow: "visible",
    "&:hover": {
      boxShadow: "0 8px 30px rgba(0, 0, 0, 0.1)"
    }
  },
  nodeSelected: {
    borderColor: "#3F51B5",
    boxShadow: "0 0 15px rgba(63, 81, 181, 0.3) !important"
  },
  nodeHeader: {
    padding: "8px 12px",
    color: "#FFFFFF",
    borderTopLeftRadius: "10px",
    borderTopRightRadius: "10px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  nodeContent: {
    padding: "12px",
    fontSize: "0.85rem",
    color: "#666"
  },
  port: {
    position: "absolute",
    width: "14px",
    height: "14px",
    borderRadius: "50%",
    backgroundColor: "#B0BEC5",
    border: "2px solid #FFFFFF",
    cursor: "crosshair",
    zIndex: 2,
    "&:hover": {
      backgroundColor: "#3F51B5",
      transform: "scale(1.2)"
    }
  },
  portInput: {
    left: "-7px",
    top: `${NODE_HEIGHT / 2}px`
  },
  portOutput: {
    right: "-7px",
    top: `${NODE_HEIGHT / 2}px`
  },
  portOutputYes: {
    right: "-7px",
    top: `${NODE_HEIGHT / 3}px`
  },
  portOutputNo: {
    right: "-7px",
    top: `${(NODE_HEIGHT * 2) / 3}px`
  },
  portLabel: {
    position: "absolute",
    fontSize: "0.65rem",
    fontWeight: "bold",
    color: "#78909C",
    right: "12px"
  },
  svgOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    pointerEvents: "none",
    zIndex: 1
  },
  sidebarItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #E0E0E0",
    cursor: "pointer",
    backgroundColor: "#FAFAFA",
    "&:hover": {
      backgroundColor: "#EEEEEE"
    }
  },
  connectionPath: {
    fill: "none",
    stroke: "#78909C",
    strokeWidth: 3,
    strokeLinecap: "round",
    "&:hover": {
      stroke: "#FF1744",
      cursor: "pointer"
    }
  },
  mappingRow: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
    marginTop: "8px"
  }
}));

const FlowBuilder = () => {
  const classes = useStyles();
  const { id } = useParams();
  const history = useHistory();

  // State values
  const [flow, setFlow] = useState({ name: "" });
  const [nodes, setNodes] = useState([]);
  const [connections, setConnections] = useState([]);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // Canvas interaction
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [draggedNodeId, setDraggedNodeId] = useState(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Connection process
  const [connecting, setConnecting] = useState(null); // { nodeId, handle, type, startX, startY }
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Options loads
  const [queues, setQueues] = useState([]);
  const [stages, setStages] = useState([]);

  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Load flow data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const { data } = await api.get(`/chatflows/${id}`);
        setFlow(data);
        const parsed = JSON.parse(data.flowData || '{"nodes":[],"connections":[]}');
        setNodes(parsed.nodes || []);
        setConnections(parsed.connections || []);
      } catch (err) {
        toast.error("Erro ao carregar dados do fluxo.");
      }
    };

    const loadOptions = async () => {
      try {
        const [qRes, kRes] = await Promise.all([
          api.get("/queues"),
          api.get("/kanban/stages")
        ]);
        setQueues(qRes.data || []);
        setStages(kRes.data || []);
      } catch (err) {
        console.error("Error loading dropdown data options: " + err.message);
      }
    };

    loadData();
    loadOptions();
  }, [id]);

  // Save flow builder state to server
  const handleSave = async () => {
    try {
      const flowData = JSON.stringify({ nodes, connections });
      await api.put(`/chatflows/${id}`, { name: flow.name, flowData });
      toast.success("Fluxo de conversa salvo com sucesso!");
    } catch (err) {
      toast.error("Erro ao salvar o fluxo.");
    }
  };

  // JSON Export
  const handleExportJSON = () => {
    const flowObj = {
      name: flow.name,
      nodes,
      connections
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(flowObj, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${flow.name || "flow"}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success("Fluxo exportado com sucesso!");
  };

  // JSON Import Trigger
  const triggerImportFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImportJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (parsed.nodes && parsed.connections) {
          setNodes(parsed.nodes);
          setConnections(parsed.connections);
          if (parsed.name) {
            setFlow(prev => ({ ...prev, name: parsed.name }));
          }
          toast.success("Fluxo importado com sucesso!");
        } else {
          toast.error("Arquivo JSON inválido. Deve conter 'nodes' e 'connections'.");
        }
      } catch (err) {
        toast.error("Erro ao ler o arquivo JSON.");
      }
    };
    reader.readAsText(file);
    e.target.value = ""; // Reset input selection
  };

  // Zoom controls
  const handleZoomIn = () => setZoom(z => Math.min(z + 0.1, 1.5));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.1, 0.5));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Pan Canvas Handlers - checks if background clicked
  const handleMouseDownCanvas = (e) => {
    if (
      e.target.id === "canvasContainer" ||
      e.target.id === "canvasGrid" ||
      e.target.tagName === "svg" ||
      e.target.id === "svgOverlay"
    ) {
      setIsPanning(true);
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMoveCanvas = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const currentMouseCanvasX = (e.clientX - rect.left) / zoom;
    const currentMouseCanvasY = (e.clientY - rect.top) / zoom;

    if (isPanning) {
      setPan({ x: e.clientX - startPan.x, y: e.clientY - startPan.y });
    } else if (draggedNodeId) {
      // Move selected node
      setNodes(ns =>
        ns.map(n => {
          if (n.id === draggedNodeId) {
            return {
              ...n,
              position: {
                x: Math.max(currentMouseCanvasX - dragStart.x, 0),
                y: Math.max(currentMouseCanvasY - dragStart.y, 0)
              }
            };
          }
          return n;
        })
      );
    } else if (connecting) {
      setMousePos({ x: currentMouseCanvasX, y: currentMouseCanvasY });
    }
  };

  const handleMouseUpCanvas = () => {
    setIsPanning(false);
    setDraggedNodeId(null);
    setConnecting(null);
  };

  // Node Drag handlers
  const handleMouseDownNode = (e, nodeId) => {
    e.stopPropagation();
    setSelectedNodeId(nodeId);
    setDraggedNodeId(nodeId);

    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const currentMouseCanvasX = (e.clientX - rect.left) / zoom;
    const currentMouseCanvasY = (e.clientY - rect.top) / zoom;

    setDragStart({
      x: currentMouseCanvasX - node.position.x,
      y: currentMouseCanvasY - node.position.y
    });
  };

  // Create Node helper
  const addNode = (type) => {
    const newId = `${type}_${Date.now()}`;
    let defaultData = {};

    if (type === "message") {
      defaultData = { text: "Olá!", simulateTyping: true, simulateRecording: false };
    } else if (type === "input") {
      defaultData = { variable: "resposta" };
    } else if (type === "condition") {
      defaultData = { conditionVar: "resposta", conditionOperator: "equals", conditionValue: "1" };
    } else if (type === "action") {
      defaultData = { actionType: "tag", tagToAdd: "" };
    } else if (type === "timer") {
      defaultData = { value: 10, unit: "seconds" };
    } else if (type === "api_request") {
      defaultData = { url: "", method: "GET", headers: "", body: "", mappings: [] };
    }

    const newNode = {
      id: newId,
      type,
      position: {
        x: 100 - pan.x + Math.random() * 50,
        y: 150 - pan.y + Math.random() * 50
      },
      data: defaultData
    };

    setNodes(ns => [...ns, newNode]);
    setSelectedNodeId(newNode.id);
  };

  // Delete node and its connections
  const deleteNode = (nodeId) => {
    if (nodeId === "start") {
      toast.warning("O nó inicial não pode ser excluído.");
      return;
    }
    setNodes(ns => ns.filter(n => n.id !== nodeId));
    setConnections(cs => cs.filter(c => c.source !== nodeId && c.target !== nodeId));
    if (selectedNodeId === nodeId) setSelectedNodeId(null);
  };

  // Connect transitions
  const handleMouseDownPort = (e, nodeId, handle, type) => {
    e.stopPropagation();
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    let startX = node.position.x + NODE_WIDTH;
    let startY = node.position.y + NODE_HEIGHT / 2;

    if (handle === "yes" || handle === "success") {
      startY = node.position.y + NODE_HEIGHT / 3;
    } else if (handle === "no" || handle === "failure") {
      startY = node.position.y + (NODE_HEIGHT * 2) / 3;
    }

    const rect = canvasRef.current.getBoundingClientRect();
    const currentMouseCanvasX = (e.clientX - rect.left) / zoom;
    const currentMouseCanvasY = (e.clientY - rect.top) / zoom;

    setConnecting({ nodeId, handle, type, startX, startY });
    setMousePos({ x: currentMouseCanvasX, y: currentMouseCanvasY });
  };

  const handleMouseUpPort = (e, targetNodeId) => {
    e.stopPropagation();
    if (!connecting || connecting.nodeId === targetNodeId) return;

    // Output ports should connect to target node inputs
    setConnections(cs => {
      // Remove any existing connection sharing this specific source and sourceHandle
      const filtered = cs.filter(
        c => !(c.source === connecting.nodeId && c.sourceHandle === connecting.handle)
      );
      return [
        ...filtered,
        {
          source: connecting.nodeId,
          target: targetNodeId,
          sourceHandle: connecting.handle || undefined
        }
      ];
    });

    setConnecting(null);
  };

  // Delete connection line
  const removeConnection = (index) => {
    setConnections(cs => cs.filter((_, i) => i !== index));
  };

  // Fetch coordinates of output handle
  const getOutputCoordinates = (nodeId, handle) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return { x: 0, y: 0 };
    let startX = node.position.x + NODE_WIDTH;
    let startY = node.position.y + NODE_HEIGHT / 2;

    if (handle === "yes" || handle === "success") {
      startY = node.position.y + NODE_HEIGHT / 3;
    } else if (handle === "no" || handle === "failure") {
      startY = node.position.y + (NODE_HEIGHT * 2) / 3;
    }

    return { x: startX, y: startY };
  };

  // Fetch coordinates of input handle
  const getInputCoordinates = (nodeId) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return { x: 0, y: 0 };
    return {
      x: node.position.x,
      y: node.position.y + NODE_HEIGHT / 2
    };
  };

  // Draw connector SVG path curve
  const drawPath = (x1, y1, x2, y2) => {
    const dx = Math.abs(x2 - x1) * 0.5;
    return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
  };

  // Node Header styles
  const getHeaderStyle = (type) => {
    if (type === "start") return { backgroundColor: "#546E7A" };
    if (type === "message") return { backgroundColor: "#1976D2" };
    if (type === "input") return { backgroundColor: "#7B1FA2" };
    if (type === "condition") return { backgroundColor: "#E65100" };
    if (type === "action") return { backgroundColor: "#388E3C" };
    if (type === "timer") return { backgroundColor: "#FF8F00" };
    if (type === "api_request") return { backgroundColor: "#3F51B5" };
    return { backgroundColor: "#607D8B" };
  };

  const getHeaderIcon = (type) => {
    if (type === "message") return <MsgIcon fontSize="small" />;
    if (type === "input") return <InputIcon fontSize="small" />;
    if (type === "condition") return <ConditionIcon fontSize="small" />;
    if (type === "action") return <ActionIcon fontSize="small" />;
    if (type === "timer") return <TimerIcon fontSize="small" />;
    if (type === "api_request") return <ApiIcon fontSize="small" />;
    return <ResetIcon fontSize="small" />;
  };

  const getNodeTitle = (type) => {
    if (type === "start") return "Início";
    if (type === "message") return "Enviar Mensagem";
    if (type === "input") return "Esperar Resposta";
    if (type === "condition") return "Condição";
    if (type === "action") return "Ação Automatizada";
    if (type === "timer") return "Temporizador";
    if (type === "api_request") return "Integração API";
    return "Bloco";
  };

  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  const updateSelectedNodeData = (field, val) => {
    setNodes(ns =>
      ns.map(n => {
        if (n.id === selectedNodeId) {
          return {
            ...n,
            data: { ...n.data, [field]: val }
          };
        }
        return n;
      })
    );
  };

  // Helper to add mapping rows in API node
  const handleAddApiMapping = () => {
    if (!selectedNode) return;
    const currentMappings = selectedNode.data.mappings || [];
    updateSelectedNodeData("mappings", [...currentMappings, { responsePath: "", variable: "" }]);
  };

  const handleUpdateApiMapping = (index, field, value) => {
    if (!selectedNode) return;
    const currentMappings = [...(selectedNode.data.mappings || [])];
    currentMappings[index] = { ...currentMappings[index], [field]: value };
    updateSelectedNodeData("mappings", currentMappings);
  };

  const handleRemoveApiMapping = (index) => {
    if (!selectedNode) return;
    const currentMappings = [...(selectedNode.data.mappings || [])];
    currentMappings.splice(index, 1);
    updateSelectedNodeData("mappings", currentMappings);
  };

  return (
    <div className={classes.root}>
      {/* Hidden file input for JSON import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportJSON}
        accept=".json"
        style={{ display: "none" }}
      />

      {/* Topbar */}
      <div className={classes.topbar}>
        <div className={classes.titleArea}>
          <IconButton onClick={() => history.push("/chatflows")} size="small">
            <BackIcon />
          </IconButton>
          <TextField
            value={flow.name}
            onChange={(e) => setFlow({ ...flow, name: e.target.value })}
            placeholder="Nome do Fluxo"
            style={{ minWidth: "200px" }}
            InputProps={{ style: { fontWeight: "bold", fontSize: "1.2rem" } }}
          />
        </div>
        <div>
          <IconButton onClick={handleZoomIn} title="Aumentar Zoom">
            <ZoomInIcon />
          </IconButton>
          <IconButton onClick={handleZoomOut} title="Diminuir Zoom">
            <ZoomOutIcon />
          </IconButton>
          <IconButton onClick={handleReset} title="Centralizar Tela">
            <ResetIcon />
          </IconButton>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<ImportIcon />}
            onClick={triggerImportFile}
            style={{ marginLeft: "12px", textTransform: "none", fontWeight: "bold" }}
          >
            Importar JSON
          </Button>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<ExportIcon />}
            onClick={handleExportJSON}
            style={{ marginLeft: "12px", textTransform: "none", fontWeight: "bold" }}
          >
            Exportar JSON
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            style={{ marginLeft: "12px", textTransform: "none", fontWeight: "bold" }}
          >
            Salvar Fluxo
          </Button>
        </div>
      </div>

      {/* Main Builder Canvas and sidebars */}
      <div className={classes.mainArea}>
        {/* Sidebar Left - Add blocks */}
        <div className={classes.sidebarLeft}>
          <Typography variant="subtitle1" style={{ fontWeight: "bold", marginBottom: "8px" }}>
            Blocos do Robô
          </Typography>
          
          <Tooltip title="Envia uma mensagem de texto ou mídia para o contato. Suporta simulação de digitação e variáveis como {nome}." placement="right" arrow>
            <div className={classes.sidebarItem} onClick={() => addNode("message")}>
              <MsgIcon style={{ color: "#1976D2" }} />
              <Typography variant="body2">Enviar Mensagem</Typography>
            </div>
          </Tooltip>

          <Tooltip title="Pausa o fluxo e aguarda a resposta do usuário, salvando o valor em uma variável personalizada." placement="right" arrow>
            <div className={classes.sidebarItem} onClick={() => addNode("input")}>
              <InputIcon style={{ color: "#7B1FA2" }} />
              <Typography variant="body2">Esperar Resposta</Typography>
            </div>
          </Tooltip>

          <Tooltip title="Desvia o caminho do robô dependendo do valor de uma variável (Ex: se a resposta é igual a 'Sim')." placement="right" arrow>
            <div className={classes.sidebarItem} onClick={() => addNode("condition")}>
              <ConditionIcon style={{ color: "#E65100" }} />
              <Typography variant="body2">Condicional</Typography>
            </div>
          </Tooltip>

          <Tooltip title="Executa uma ação do sistema em segundo plano, como adicionar tags, mover no Kanban ou transferir/encerrar." placement="right" arrow>
            <div className={classes.sidebarItem} onClick={() => addNode("action")}>
              <ActionIcon style={{ color: "#388E3C" }} />
              <Typography variant="body2">Ação Automatizada</Typography>
            </div>
          </Tooltip>

          <Tooltip title="Atrasa a próxima ação do fluxo por um período determinado de segundos, minutos, horas ou dias." placement="right" arrow>
            <div className={classes.sidebarItem} onClick={() => addNode("timer")}>
              <TimerIcon style={{ color: "#FF8F00" }} />
              <Typography variant="body2">Temporizador</Typography>
            </div>
          </Tooltip>

          <Tooltip title="Faz uma chamada HTTP (GET/POST) externa para integrar dados com outros sistemas externos." placement="right" arrow>
            <div className={classes.sidebarItem} onClick={() => addNode("api_request")}>
              <ApiIcon style={{ color: "#3F51B5" }} />
              <Typography variant="body2">Integração API</Typography>
            </div>
          </Tooltip>

          <Divider style={{ margin: "16px 0" }} />
          <Paper style={{ padding: "12px", backgroundColor: "rgba(0, 0, 0, 0.04)", borderRadius: 4 }}>
            <Typography variant="caption" style={{ fontWeight: "bold", display: "block", marginBottom: 4 }}>
              💡 Dica Rápida:
            </Typography>
            <Typography variant="caption" color="textSecondary" style={{ display: "block", fontSize: "0.75rem", lineHeight: 1.3 }}>
              Arraste o círculo cinza (saída) de um bloco até o círculo do outro bloco (entrada) para conectá-los. Clique em uma linha de conexão para removê-la.
            </Typography>
          </Paper>
        </div>

        {/* Builder Canvas viewport */}
        <div
          id="canvasContainer"
          className={`${classes.canvasContainer} ${isPanning ? classes.canvasActive : ""}`}
          onMouseDown={handleMouseDownCanvas}
          onMouseMove={handleMouseMoveCanvas}
          onMouseUp={handleMouseUpCanvas}
          ref={canvasRef}
        >
          <div
            id="canvasGrid"
            className={classes.canvas}
            style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
          >
            {/* SVG connections layer */}
            <svg id="svgOverlay" className={classes.svgOverlay}>
              {/* Render connecting temporary path */}
              {connecting && (
                <path
                  d={drawPath(connecting.startX, connecting.startY, mousePos.x, mousePos.y)}
                  fill="none"
                  stroke="#3F51B5"
                  strokeWidth={3}
                  strokeDasharray="5,5"
                />
              )}

              {/* Render existing flow paths */}
              {connections.map((c, index) => {
                const start = getOutputCoordinates(c.source, c.sourceHandle);
                const end = getInputCoordinates(c.target);
                return (
                  <path
                    key={index}
                    d={drawPath(start.x, start.y, end.x, end.y)}
                    className={classes.connectionPath}
                    title="Excluir Conexão"
                    onClick={() => removeConnection(index)}
                  />
                );
              })}
            </svg>

            {/* Render Nodes list */}
            {nodes.map((node) => (
              <div
                key={node.id}
                className={`${classes.node} ${selectedNodeId === node.id ? classes.nodeSelected : ""}`}
                style={{ left: `${node.position.x}px`, top: `${node.position.y}px` }}
                onMouseDown={(e) => handleMouseDownNode(e, node.id)}
              >
                {/* Node Header */}
                <div className={classes.nodeHeader} style={getHeaderStyle(node.type)}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {getHeaderIcon(node.type)}
                    <span style={{ fontWeight: "bold", fontSize: "0.85rem" }}>
                      {getNodeTitle(node.type)}
                    </span>
                  </div>
                  {node.id !== "start" && (
                    <IconButton
                      size="small"
                      style={{ color: "#FFFFFF" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNode(node.id);
                      }}
                    >
                      <DeleteIcon fontSize="inherit" />
                    </IconButton>
                  )}
                </div>

                {/* Node Description content */}
                <div className={classes.nodeContent}>
                  {node.type === "start" && "O fluxo começa aqui"}
                  {node.type === "message" && (
                    <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {node.data.text || "Sem mensagem"}
                    </div>
                  )}
                  {node.type === "input" && (
                    <div>Salvar em: <b>{`{${node.data.variable || ""}}`}</b></div>
                  )}
                  {node.type === "condition" && (
                    <div>
                      Se: <b>{node.data.conditionVar}</b>
                    </div>
                  )}
                  {node.type === "action" && (
                    <div>
                      Ação: <b>{node.data.actionType}</b>
                    </div>
                  )}
                  {node.type === "timer" && (
                    <div>
                      Aguardar: <b>{node.data.value} {node.data.unit}</b>
                    </div>
                  )}
                  {node.type === "api_request" && (
                    <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      <b>{node.data.method || "GET"}</b>: {node.data.url || "URL da API"}
                    </div>
                  )}
                </div>

                {/* Left side input handle port */}
                {node.type !== "start" && (
                  <div
                    className={`${classes.port} ${classes.portInput}`}
                    onMouseUp={(e) => handleMouseUpPort(e, node.id)}
                  />
                )}

                {/* Right side output ports handles */}
                {node.type === "condition" ? (
                  <>
                    <div
                      className={`${classes.port} ${classes.portOutputYes}`}
                      onMouseDown={(e) => handleMouseDownPort(e, node.id, "yes", "output")}
                    >
                      <span className={classes.portLabel} style={{ top: "-3px" }}>Sim</span>
                    </div>
                    <div
                      className={`${classes.port} ${classes.portOutputNo}`}
                      onMouseDown={(e) => handleMouseDownPort(e, node.id, "no", "output")}
                    >
                      <span className={classes.portLabel} style={{ top: "-3px" }}>Não</span>
                    </div>
                  </>
                ) : node.type === "api_request" ? (
                  <>
                    <div
                      className={`${classes.port} ${classes.portOutputYes}`}
                      onMouseDown={(e) => handleMouseDownPort(e, node.id, "success", "output")}
                    >
                      <span className={classes.portLabel} style={{ top: "-3px" }}>Ok</span>
                    </div>
                    <div
                      className={`${classes.port} ${classes.portOutputNo}`}
                      onMouseDown={(e) => handleMouseDownPort(e, node.id, "failure", "output")}
                    >
                      <span className={classes.portLabel} style={{ top: "-3px" }}>Erro</span>
                    </div>
                  </>
                ) : (
                  node.data.actionType !== "close" &&
                  node.data.actionType !== "transfer" && (
                    <div
                      className={`${classes.port} ${classes.portOutput}`}
                      onMouseDown={(e) => handleMouseDownPort(e, node.id, null, "output")}
                    />
                  )
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Right - Node Properties Editor */}
        <div className={classes.sidebarRight}>
          <Typography variant="h6" style={{ fontWeight: "bold" }}>
            Propriedades
          </Typography>
          <Divider />

          {selectedNode ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <Typography variant="subtitle2" style={{ fontWeight: "bold" }}>
                Identificação do Bloco:
              </Typography>
              <Typography variant="body2" color="textSecondary">
                ID: {selectedNode.id}
              </Typography>

              {/* Message properties */}
              {selectedNode.type === "message" && (
                <>
                  <TextField
                    label="Mensagem de Texto"
                    multiline
                    minRows={4}
                    variant="outlined"
                    fullWidth
                    value={selectedNode.data.text || ""}
                    onChange={(e) => updateSelectedNodeData("text", e.target.value)}
                    helperText="Variáveis úteis: {nome}, {numero} ou variáveis personalizadas."
                  />

                  <TextField
                    label="Anexo URL (Opcional)"
                    placeholder="https://exemplo.com/audio.mp3"
                    variant="outlined"
                    fullWidth
                    value={selectedNode.data.mediaUrl || ""}
                    onChange={(e) => updateSelectedNodeData("mediaUrl", e.target.value)}
                  />

                  <FormControl variant="outlined" fullWidth>
                    <InputLabel>Tipo de Anexo</InputLabel>
                    <Select
                      value={selectedNode.data.mediaType || "image/png"}
                      onChange={(e) => updateSelectedNodeData("mediaType", e.target.value)}
                      label="Tipo de Anexo"
                    >
                      <MenuItem value="image/png">Imagem (PNG/JPG)</MenuItem>
                      <MenuItem value="audio/mp3">Áudio (MP3/OGG)</MenuItem>
                      <MenuItem value="video/mp4">Vídeo (MP4)</MenuItem>
                      <MenuItem value="application/pdf">Documento (PDF)</MenuItem>
                    </Select>
                  </FormControl>

                  <Grid container alignItems="center" justifyContent="space-between">
                    <Grid item>
                      <Typography variant="body2" style={{ fontWeight: "bold" }}>
                        Simular digitando...
                      </Typography>
                    </Grid>
                    <Grid item>
                      <Switch
                        checked={!!selectedNode.data.simulateTyping}
                        onChange={(e) => updateSelectedNodeData("simulateTyping", e.target.checked)}
                        color="primary"
                      />
                    </Grid>
                  </Grid>

                  <Grid container alignItems="center" justifyContent="space-between">
                    <Grid item>
                      <Typography variant="body2" style={{ fontWeight: "bold" }}>
                        Simular gravando áudio...
                      </Typography>
                    </Grid>
                    <Grid item>
                      <Switch
                        checked={!!selectedNode.data.simulateRecording}
                        onChange={(e) => updateSelectedNodeData("simulateRecording", e.target.checked)}
                        color="primary"
                        disabled={selectedNode.data.mediaType !== "audio/mp3"}
                      />
                    </Grid>
                  </Grid>
                </>
              )}

              {/* Input properties */}
              {selectedNode.type === "input" && (
                <TextField
                  label="Salvar resposta na variável"
                  placeholder="Ex: email"
                  variant="outlined"
                  fullWidth
                  value={selectedNode.data.variable || ""}
                  onChange={(e) => updateSelectedNodeData("variable", e.target.value)}
                  helperText="A resposta do usuário será salva nesta variável. Use {variavel} para exibir o valor em outros blocos."
                />
              )}

              {/* Condition properties */}
              {selectedNode.type === "condition" && (
                <>
                  <TextField
                    label="Testar Variável"
                    placeholder="Ex: email"
                    variant="outlined"
                    fullWidth
                    value={selectedNode.data.conditionVar || ""}
                    onChange={(e) => updateSelectedNodeData("conditionVar", e.target.value)}
                  />

                  <FormControl variant="outlined" fullWidth>
                    <InputLabel>Critério de Comparação</InputLabel>
                    <Select
                      value={selectedNode.data.conditionOperator || "equals"}
                      onChange={(e) => updateSelectedNodeData("conditionOperator", e.target.value)}
                      label="Critério de Comparação"
                    >
                      <MenuItem value="equals">É exatamente igual a</MenuItem>
                      <MenuItem value="contains">Contém o texto</MenuItem>
                      <MenuItem value="starts_with">Começa com</MenuItem>
                      <MenuItem value="is_empty">Está vazia / em branco</MenuItem>
                    </Select>
                  </FormControl>

                  {selectedNode.data.conditionOperator !== "is_empty" && (
                    <TextField
                      label="Valor Esperado"
                      variant="outlined"
                      fullWidth
                      value={selectedNode.data.conditionValue || ""}
                      onChange={(e) => updateSelectedNodeData("conditionValue", e.target.value)}
                    />
                  )}
                </>
              )}

              {/* Action properties */}
              {selectedNode.type === "action" && (
                <>
                  <FormControl variant="outlined" fullWidth>
                    <InputLabel>Tipo de Ação</InputLabel>
                    <Select
                      value={selectedNode.data.actionType || "tag"}
                      onChange={(e) => {
                        updateSelectedNodeData("actionType", e.target.value);
                        // Clear old connection to start refreshing port count if needed
                        setConnections(cs => cs.filter(c => c.source !== selectedNodeId));
                      }}
                      label="Tipo de Ação"
                    >
                      <MenuItem value="tag">Adicionar Tag no Contato</MenuItem>
                      <MenuItem value="kanban">Enviar para Etapa do Kanban</MenuItem>
                      <MenuItem value="transfer">Transferir para Fila/Atendente</MenuItem>
                      <MenuItem value="close">Encerrar Conversa (Finalizar Ticket)</MenuItem>
                    </Select>
                  </FormControl>

                  {selectedNode.data.actionType === "tag" && (
                    <TextField
                      label="Nome da Tag"
                      placeholder="Ex: Lead Quente"
                      variant="outlined"
                      fullWidth
                      value={selectedNode.data.tagToAdd || ""}
                      onChange={(e) => updateSelectedNodeData("tagToAdd", e.target.value)}
                    />
                  )}

                  {selectedNode.data.actionType === "kanban" && (
                    <FormControl variant="outlined" fullWidth>
                      <InputLabel>Etapa do Kanban</InputLabel>
                      <Select
                        value={selectedNode.data.kanbanStageId || ""}
                        onChange={(e) => updateSelectedNodeData("kanbanStageId", e.target.value)}
                        label="Etapa do Kanban"
                      >
                        {stages.map(s => (
                          <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}

                  {selectedNode.data.actionType === "transfer" && (
                    <FormControl variant="outlined" fullWidth>
                      <InputLabel>Fila de Atendimento</InputLabel>
                      <Select
                        value={selectedNode.data.queueId || ""}
                        onChange={(e) => updateSelectedNodeData("queueId", e.target.value)}
                        label="Fila de Atendimento"
                      >
                        {queues.map(q => (
                          <MenuItem key={q.id} value={q.id}>{q.name}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                </>
              )}

              {/* Timer / Delay properties */}
              {selectedNode.type === "timer" && (
                <>
                  <TextField
                    label="Tempo de Atraso"
                    type="number"
                    variant="outlined"
                    fullWidth
                    value={selectedNode.data.value || 10}
                    onChange={(e) => updateSelectedNodeData("value", Number(e.target.value))}
                    inputProps={{ min: 1 }}
                  />

                  <FormControl variant="outlined" fullWidth>
                    <InputLabel>Unidade de Tempo</InputLabel>
                    <Select
                      value={selectedNode.data.unit || "seconds"}
                      onChange={(e) => updateSelectedNodeData("unit", e.target.value)}
                      label="Unidade de Tempo"
                    >
                      <MenuItem value="seconds">Segundos</MenuItem>
                      <MenuItem value="minutes">Minutos</MenuItem>
                      <MenuItem value="hours">Horas</MenuItem>
                      <MenuItem value="days">Dias</MenuItem>
                    </Select>
                  </FormControl>
                </>
              )}

              {/* API request properties */}
              {selectedNode.type === "api_request" && (
                <>
                  <FormControl variant="outlined" fullWidth>
                    <InputLabel>Método HTTP</InputLabel>
                    <Select
                      value={selectedNode.data.method || "GET"}
                      onChange={(e) => updateSelectedNodeData("method", e.target.value)}
                      label="Método HTTP"
                    >
                      <MenuItem value="GET">GET</MenuItem>
                      <MenuItem value="POST">POST</MenuItem>
                    </Select>
                  </FormControl>

                  <TextField
                    label="URL da API"
                    placeholder="https://api.exemplo.com/endpoint"
                    variant="outlined"
                    fullWidth
                    value={selectedNode.data.url || ""}
                    onChange={(e) => updateSelectedNodeData("url", e.target.value)}
                    helperText="Aceita variáveis no formato {var_name}."
                  />

                  <TextField
                    label="Headers (JSON)"
                    placeholder='{"Authorization": "Bearer token"}'
                    multiline
                    minRows={2}
                    variant="outlined"
                    fullWidth
                    value={selectedNode.data.headers || ""}
                    onChange={(e) => updateSelectedNodeData("headers", e.target.value)}
                  />

                  {selectedNode.data.method === "POST" && (
                    <TextField
                      label="Corpo da Requisição (JSON)"
                      placeholder='{"cliente": "{nome}"}'
                      multiline
                      minRows={3}
                      variant="outlined"
                      fullWidth
                      value={selectedNode.data.body || ""}
                      onChange={(e) => updateSelectedNodeData("body", e.target.value)}
                    />
                  )}

                  <Divider />
                  
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="subtitle2" style={{ fontWeight: "bold" }}>
                      Mapeamento de Retorno:
                    </Typography>
                    <IconButton size="small" onClick={handleAddApiMapping} color="primary" title="Adicionar Regra">
                      <AddIcon />
                    </IconButton>
                  </div>

                  {(selectedNode.data.mappings || []).map((mapping, idx) => (
                    <div key={idx} className={classes.mappingRow}>
                      <TextField
                        placeholder="data.status"
                        variant="outlined"
                        size="small"
                        value={mapping.responsePath}
                        onChange={(e) => handleUpdateApiMapping(idx, "responsePath", e.target.value)}
                        style={{ flex: 1 }}
                      />
                      <Typography variant="body2">→</Typography>
                      <TextField
                        placeholder="status_api"
                        variant="outlined"
                        size="small"
                        value={mapping.variable}
                        onChange={(e) => handleUpdateApiMapping(idx, "variable", e.target.value)}
                        style={{ flex: 1 }}
                      />
                      <IconButton size="small" onClick={() => handleRemoveApiMapping(idx)} color="secondary">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </div>
                  ))}
                  {(selectedNode.data.mappings || []).length === 0 && (
                    <Typography variant="caption" color="textSecondary" style={{ textAlign: "center" }}>
                      Nenhum mapeamento de variáveis configurado.
                    </Typography>
                  )}
                </>
              )}
            </div>
          ) : (
            <Typography variant="body2" color="textSecondary" style={{ textAlign: "center", marginTop: "20px" }}>
              Selecione um bloco no canvas para editar suas propriedades.
            </Typography>
          )}
        </div>
      </div>
    </div>
  );
};

export default FlowBuilder;
