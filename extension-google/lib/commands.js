const MANAGED_KEY = "managedTabIds";

async function getManagedTabs() {
  const data = await chrome.storage.local.get([MANAGED_KEY]);
  return Array.isArray(data[MANAGED_KEY]) ? data[MANAGED_KEY] : [];
}

async function setManagedTabs(ids) {
  await chrome.storage.local.set({ [MANAGED_KEY]: ids });
}

async function addManagedTab(tabId) {
  const ids = await getManagedTabs();
  if (!ids.includes(tabId)) {
    ids.push(tabId);
    await setManagedTabs(ids);
  }
}

async function removeManagedTab(tabId) {
  const ids = await getManagedTabs();
  await setManagedTabs(ids.filter((id) => id !== tabId));
}

export async function executeCommand(command) {
  const type = command.command;
  const payload = command.payload || {};

  switch (type) {
    case "PING":
      return { pong: true, at: new Date().toISOString() };

    case "OPEN_TAB": {
      if (!payload.url) throw new Error("URL kosong.");
      const tab = await chrome.tabs.create({ url: payload.url, active: payload.active !== false });
      await addManagedTab(tab.id);
      return { tabId: tab.id, url: tab.url || payload.url };
    }

    case "CLOSE_TAB": {
      if (!payload.tabId) throw new Error("tabId wajib.");
      await chrome.tabs.remove(payload.tabId);
      await removeManagedTab(payload.tabId);
      return { closed: payload.tabId };
    }

    case "RELOAD_TAB": {
      if (!payload.tabId) throw new Error("tabId wajib.");
      await chrome.tabs.reload(payload.tabId);
      return { reloaded: payload.tabId };
    }

    case "FOCUS_TAB": {
      if (!payload.tabId) throw new Error("tabId wajib.");
      const tab = await chrome.tabs.get(payload.tabId);
      await chrome.windows.update(tab.windowId, { focused: true });
      await chrome.tabs.update(payload.tabId, { active: true });
      return { focused: payload.tabId };
    }

    case "LIST_TABS": {
      const tabs = await chrome.tabs.query({});
      return tabs.map((tab) => ({
        id: tab.id,
        title: tab.title || "",
        url: tab.url || "",
        active: !!tab.active,
        windowId: tab.windowId
      }));
    }

    case "CLOSE_ALL_MANAGED": {
      const ids = await getManagedTabs();
      const existing = [];
      for (const id of ids) {
        try {
          await chrome.tabs.get(id);
          existing.push(id);
        } catch (_) {}
      }

      if (existing.length) await chrome.tabs.remove(existing);
      await setManagedTabs([]);
      return { closed: existing.length };
    }

    case "CLOSE_TABS_URL": {
      if (!payload.urlContains) throw new Error("urlContains wajib.");
      const tabs = await chrome.tabs.query({});
      const matches = tabs
        .filter((tab) => (tab.url || "").includes(payload.urlContains))
        .map((tab) => tab.id);

      if (matches.length) await chrome.tabs.remove(matches);
      for (const id of matches) await removeManagedTab(id);
      return { closed: matches.length, tabIds: matches };
    }

    default:
      throw new Error("Command tidak dikenal: " + type);
  }
}
