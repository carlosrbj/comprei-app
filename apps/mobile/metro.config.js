const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");
const fs = require("fs");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");
const workspaceNodeModules = path.resolve(workspaceRoot, "node_modules");

const config = getDefaultConfig(projectRoot);

// ─── Fix: axios 1.x Node.js bundle in React Native ───────────────────────────
//
// axios 1.x sets "main": "./dist/node/axios.cjs" in package.json.
// That file requires Node.js built-ins (crypto, http, url) which do not exist
// in React Native's Metro environment.
//
// The package.json "exports" field has a "react-native" condition that correctly
// points to "./dist/browser/axios.cjs", but Expo SDK 52 / Metro has
// unstable_enablePackageExports = false by default, so exports are ignored.
//
// Fix: intercept "axios" in resolveRequest and redirect to the browser bundle.
config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (moduleName === "axios") {
        // Try project-local first (EAS standalone), then workspace root (monorepo dev)
        const candidates = [
            path.resolve(projectRoot, "node_modules/axios/dist/browser/axios.cjs"),
            path.resolve(workspaceRoot, "node_modules/axios/dist/browser/axios.cjs"),
        ];
        for (const candidate of candidates) {
            if (fs.existsSync(candidate)) {
                return { filePath: candidate, type: "sourceFile" };
            }
        }
    }
    return context.resolveRequest(context, moduleName, platform);
};

if (fs.existsSync(workspaceNodeModules)) {
    // Monorepo environment (local dev): use hoisted node_modules from workspace root.
    config.watchFolders = [workspaceNodeModules];
    config.resolver.nodeModulesPaths = [
        path.resolve(projectRoot, "node_modules"),
        workspaceNodeModules,
    ];
    // Block Metro from resolving anything inside the backend
    const backendDir = path.resolve(workspaceRoot, "apps/backend");
    config.resolver.blockList = [
        new RegExp(`^${backendDir.replace(/[/\\^$*+?.()|[\]{}]/g, "\\$&")}.*$`),
    ];
} else {
    // Standalone environment (EAS build): all deps are installed locally.
    config.resolver.nodeModulesPaths = [
        path.resolve(projectRoot, "node_modules"),
    ];
}

module.exports = withNativeWind(config, { input: "./global.css" });
