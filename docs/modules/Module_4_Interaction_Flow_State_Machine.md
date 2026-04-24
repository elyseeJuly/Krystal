## 模块四：前端交互生命周期与状态机 (Interaction Flow & State Machine)
前端的交互流转需全面替换传统大厂黑话（如“安装、运行、报错”），建立基于 KIP 协议与物理晶体学映射的状态机系统。

### 4.1 全生命周期动作字典 (Action Vocabulary)
前端 Agent 在派发事件或更新 UI 状态时，必须使用以下标准动词：
*   **结晶 (Crystallize)**：指将自然语言/Prompt 打包并渲染为 `.krys` 文件的过程。
*   **重结晶 (Recrystallize)**：指创作者对既有晶体进行版本迭代、功能更新或参数优化的过程。
*   **折射 (Refract)**：指大模型读取晶体文件并开始执行输出的状态。
*   **色散 (Dispersion)**：指大模型解析完毕后，将晶体的不同能力拆解为多个可用“切面 (Facet)”，并渲染到前端 UI 供用户交互的过程。
*   **解理 (Cleavage)**：指用户终止晶体运行、卸载工作流，并让系统恢复至初始无污染状态的过程。
*   **晶格缺陷 (Lattice Defect)**：指执行异常、代码报错或 API 崩溃的错误状态。
*   **晶簇组装 (Cluster Assembly)**：指前端支持将多个独立晶体进行连线、组合，形成复杂多 Agent 协同工作流的动作。

### 4.2 运行时状态机 (Crystal Runtime / CR)
前端应用本质上是一个 **Crystal Runtime (CR)**。状态机需处理以下阶段：
1.  **挂载中 (Mounting)**：读取 `.krys` 文件或通过 Crystal Link (CL) 唤起。
2.  **晶格校验 (Xtal-Validation)**：调用安全引擎验证指纹、比对哈希、检测带隙颜色权限。
3.  **折射执行 (Refracting)**：向底层大模型注入系统提示词，进入执行环节。
