"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, Database, PlugZap } from "lucide-react";
import { Button } from "../components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card.tsx";
import { Input } from "../components/ui/input.tsx";
import { Label } from "../components/ui/label.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select.tsx";
import { Badge } from "../components/ui/badge.tsx";

interface DatabaseConnectorsPanelProps {
  onBack: () => void;
  onTestConnection?: (payload: any) => Promise<void> | void;
  onConnectAndImport?: (payload: any) => Promise<void> | void;
  disabled?: boolean;
}

const portMap: Record<string, string> = {
  postgresql: "5432",
  mysql: "3306",
  mssql: "1433",
  sqlite: "",
};

export function DatabaseConnectorsPanel({
  onBack,
  onTestConnection,
  onConnectAndImport,
  disabled = false,
}: DatabaseConnectorsPanelProps) {
  const [dbType, setDbType] = useState<"postgresql" | "mysql" | "mssql" | "sqlite">("postgresql");
  const [host, setHost] = useState("localhost");
  const [port, setPort] = useState(portMap.postgresql);
  const [database, setDatabase] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [schemaName, setSchemaName] = useState("public");
  const [tableName, setTableName] = useState("");
  const [sqlitePath, setSqlitePath] = useState("");
  const [status, setStatus] = useState<"idle" | "testing" | "ok" | "error">("idle");

  const payload = useMemo(
    () => ({
      db_type: dbType,
      host,
      port,
      database,
      username,
      password,
      schema: schemaName,
      table: tableName,
      sqlite_path: sqlitePath,
    }),
    [dbType, host, port, database, username, password, schemaName, tableName, sqlitePath],
  );

  const isSqlite = dbType === "sqlite";
  const canSubmit = isSqlite ? sqlitePath.trim() !== "" && tableName.trim() !== "" : host.trim() !== "" && database.trim() !== "" && username.trim() !== "" && tableName.trim() !== "";

  const handleDbChange = (value: string) => {
    const next = value as "postgresql" | "mysql" | "mssql" | "sqlite";
    setDbType(next);
    setPort(portMap[next]);
    if (next === "sqlite") {
      setSchemaName("");
    } else if (!schemaName) {
      setSchemaName("public");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={onBack} className="bg-[#1e1e1e] border-[#2a2a2a] hover:bg-[#2a2a2a]">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h2 className="text-2xl font-bold">Database Connectors</h2>
      </div>

      <Card className="bg-[#121212] border-[#2a2a2a]">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-400" />
            Configure source connection
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Connector type</Label>
            <Select value={dbType} onValueChange={handleDbChange}>
              <SelectTrigger className="bg-[#1a1a1a] border-[#2a2a2a]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                <SelectItem value="postgresql">PostgreSQL</SelectItem>
                <SelectItem value="mysql">MySQL</SelectItem>
                <SelectItem value="mssql">SQL Server</SelectItem>
                <SelectItem value="sqlite">SQLite</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {!isSqlite && (
            <>
              <div className="space-y-2">
                <Label>Host</Label>
                <Input value={host} onChange={(e) => setHost(e.target.value)} className="bg-[#1a1a1a] border-[#2a2a2a]" />
              </div>
              <div className="space-y-2">
                <Label>Port</Label>
                <Input value={port} onChange={(e) => setPort(e.target.value)} className="bg-[#1a1a1a] border-[#2a2a2a]" />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label>{isSqlite ? "SQLite file path" : "Database"}</Label>
            <Input
              value={isSqlite ? sqlitePath : database}
              onChange={(e) => (isSqlite ? setSqlitePath(e.target.value) : setDatabase(e.target.value))}
              placeholder={isSqlite ? "C:\\data\\warehouse.db" : "analytics"}
              className="bg-[#1a1a1a] border-[#2a2a2a]"
            />
          </div>

          {!isSqlite && (
            <>
              <div className="space-y-2">
                <Label>Username</Label>
                <Input value={username} onChange={(e) => setUsername(e.target.value)} className="bg-[#1a1a1a] border-[#2a2a2a]" />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-[#1a1a1a] border-[#2a2a2a]" />
              </div>
            </>
          )}

          {!isSqlite && (
            <div className="space-y-2">
              <Label>Schema</Label>
              <Input value={schemaName} onChange={(e) => setSchemaName(e.target.value)} className="bg-[#1a1a1a] border-[#2a2a2a]" />
            </div>
          )}

          <div className="space-y-2">
            <Label>Table</Label>
            <Input value={tableName} onChange={(e) => setTableName(e.target.value)} placeholder="orders" className="bg-[#1a1a1a] border-[#2a2a2a]" />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          disabled={disabled || !canSubmit}
          className="bg-[#1e1e1e] border-[#2a2a2a] hover:bg-[#2a2a2a]"
          onClick={async () => {
            try {
              setStatus("testing");
              await onTestConnection?.(payload);
              setStatus("ok");
            } catch {
              setStatus("error");
            }
          }}
        >
          <PlugZap className="h-4 w-4 mr-2" />
          Test connection
        </Button>
        <Button
          disabled={disabled || !canSubmit}
          className="bg-blue-600 hover:bg-blue-700"
          onClick={() => onConnectAndImport?.(payload)}
        >
          Connect and Import
        </Button>
        {status !== "idle" && (
          <Badge className={status === "ok" ? "bg-green-500/20 text-green-300 border-green-600/40" : status === "testing" ? "bg-yellow-500/20 text-yellow-300 border-yellow-600/40" : "bg-red-500/20 text-red-300 border-red-600/40"}>
            {status === "ok" ? "Connection OK" : status === "testing" ? "Testing..." : "Connection failed"}
          </Badge>
        )}
      </div>
    </div>
  );
}

