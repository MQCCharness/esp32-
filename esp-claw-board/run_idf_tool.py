"""ESP-IDF 工具启动器

背景：Git Bash 会注入 MSYSTEM=MINGW64，而 ESP-IDF 的 idf_tools.py 用
`if 'MSYSTEM' in os.environ` 判定 MSys 环境并直接拒绝运行（赋空值无效，
因为只检查键是否存在）。bash 侧 unset / env -u 均被 profile 覆盖。

本启动器在 Python 进程内真正删除该键，再以 __main__ 身份执行目标脚本。

用法: python run_idf_tool.py <目标脚本> [参数...]
"""
import os
import runpy
import sys

os.environ.pop("MSYSTEM", None)

if len(sys.argv) < 2:
    sys.exit("用法: python run_idf_tool.py <目标脚本> [参数...]")

script = sys.argv[1]
# runpy 不把脚本所在目录加入模块搜索路径，而 idf_tools.py 会 import 同目录模块
sys.path.insert(0, os.path.dirname(os.path.abspath(script)))
sys.argv = [script] + sys.argv[2:]
runpy.run_path(script, run_name="__main__")
